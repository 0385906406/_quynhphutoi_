// Tin từ NGUỒN NGOÀI → bài viết. Dùng chung cho:
//   - nút "Tạo tin từ nguồn ngoài" ở admin (app/api/admin/articles/external)
//   - lượt TỰ ĐỘNG hằng ngày (cron /api/cron/news-auto, hoặc admin bấm "Chạy ngay")
// Lượt tự động: lấy tin mới (bỏ tin đã nhập theo link gốc) → AI viết lại toàn văn → tạo
// bài NHÁP chờ duyệt, hoặc HẸN GIỜ đăng rải trong ngày (bài tự lên khi tới giờ — xem
// publishDue trong lib/articles.ts).
import { getDb } from "@/lib/db";
import { articles, createArticle, publishDueArticles, type ArticleInput } from "@/lib/articles";
import { sanitizeHtml } from "@/lib/sanitize";
import { fetchExternalNews, externalNewsConfigured, type ExternalNewsItem } from "@/lib/external-news";
import { importArticleFromUrl } from "@/lib/url-import";
import { getSettingsRaw } from "@/lib/settings";
import { configuredProviders } from "@/lib/ai-call";
import { listActiveCategoryOptions } from "@/lib/categories";
import { logActivity } from "@/lib/activity-log";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Tự sinh keywords từ title: lấy các từ có nghĩa (≥4 ký tự, bỏ stop-words phổ biến).
const STOP = new Set(["được","không","trong","ngoài","những","cũng","đang","sẽ","đã","này","đó","các","một","và","của","cho","với","từ","trên","tại","theo","để","về","vào","như","còn","khi","sau","trước","qua","bởi","thì","mà","hay","hoặc","nhưng","vì","nên","nếu","dù","rằng","tới","tuy"]);
function extractKeywords(title: string, source?: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  const kws = [...new Set(words)].slice(0, 6);
  if (source) kws.push(source);
  return kws;
}

// Dòng dẫn nguồn (link bài gốc) — luôn có ở cuối bài nhập từ nguồn ngoài.
function sourceLine(it: ExternalNewsItem): string {
  if (!it.url) return "";
  const label = esc(it.source || it.url);
  return `<p>Nguồn: <a href="${esc(it.url)}" target="_blank" rel="noopener nofollow">${label}</a></p>`;
}

// Bản nháp NGẮN từ 1 tin ngoài: tóm tắt + dòng dẫn nguồn.
function bodyFrom(it: ExternalNewsItem): string {
  return [it.description ? `<p>${esc(it.description)}</p>` : "", sourceLine(it)].filter(Boolean).join("\n");
}

export type BuiltExternal = { input: ArticleInput; usedAi: boolean; warning?: string };

// 1 tin ngoài → dữ liệu tạo bài (CHƯA lưu). full=true → tải bài gốc + (AI) viết lại toàn văn;
// lỗi tải/AI → rơi về bản ngắn kèm cảnh báo.
export async function buildExternalArticle(
  it: ExternalNewsItem,
  opts: { full: boolean; useAi: boolean; category: { name: string; slug: string } },
): Promise<BuiltExternal | null> {
  let title = String(it?.title || "").trim();
  if (!title) return null;
  let image = typeof it.image === "string" && it.image.startsWith("http") ? it.image : "";
  let excerpt = String(it.description || "").trim().slice(0, 300);
  let bodyHtml = bodyFrom(it);
  let tags = extractKeywords(title);
  // keywords[0] = "Từ khoá chính" trong trình soạn. Các từ đơn tự tách ("tổng", "giới"…) không
  // phải từ khoá thật → để TRỐNG cho admin tự đặt; chỉ điền khi AI gợi ý được cụm từ khoá.
  let keywords: string[] = [];
  let usedAi = false;
  let warning: string | undefined;

  if (opts.full && it.url) {
    try {
      const r = await importArticleFromUrl(it.url, { useAi: opts.useAi });
      usedAi = r.usedAi;
      title = (r.title || title).trim().slice(0, 200);
      excerpt = (r.excerpt || excerpt).trim().slice(0, 300);
      if (!image && r.ogImage?.startsWith("http")) image = r.ogImage;
      const fromTags = r.tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (fromTags.length) tags = fromTags.slice(0, 8);
      // Từ khoá chính (AI gợi ý) đứng đầu → trình soạn hiện ở ô "Từ khoá chính".
      if (r.focusKeyword) {
        keywords = [r.focusKeyword, ...tags].filter(Boolean)
          .filter((k, i, arr) => arr.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i);
      }
      // Luôn ghi nguồn bài gốc ở cuối bài.
      if (r.bodyHtml) bodyHtml = `${r.bodyHtml}\n${sourceLine(it)}`;
    } catch (e) {
      warning = `“${title.slice(0, 60)}”: ${e instanceof Error ? e.message : "không lấy được toàn văn"} — đã tạo bản nháp ngắn.`;
    }
  }

  return {
    usedAi,
    warning,
    input: {
      title,
      excerpt,
      category: opts.category.name,
      categorySlug: opts.category.slug,
      scope: "ngoai-xa",
      tags,
      coverImage: image,
      coverAlt: title, // luôn set alt = title kể cả khi chưa có ảnh (admin thêm ảnh sau)
      author: {
        name: "Ban biên tập",
        title: it.source ? `Nguồn: ${it.source}` : "Tổng hợp",
      },
      bodyHtml: sanitizeHtml(bodyHtml),
      featured: false,
      status: "draft",
      sourceUrl: it.url || undefined,
      seo: {
        metaTitle: title,
        metaDescription: excerpt.slice(0, 160) || undefined,
        keywords,
        ogImage: image || undefined,
      },
    },
  };
}

// Chuyên mục Tin tức theo slug — chỉ nhận slug có thật & đang bật; sai/thiếu → "Tin tức".
export async function resolveNewsCategory(slug: string): Promise<{ name: string; slug: string }> {
  const cat = slug ? (await listActiveCategoryOptions("tin-tuc")).find((c) => c.slug === slug) : undefined;
  return cat ? { name: cat.name, slug: cat.slug } : { name: "Tin tức", slug: "tin-tuc" };
}

// ───────────────────────── Lượt tự động ─────────────────────────

export type NewsAutoRun = {
  at: string;                       // ISO — lúc chạy
  trigger: "cron" | "manual";
  ok: boolean;
  mode: "draft" | "schedule";
  created: { slug: string; title: string; scheduledAt: string | null }[];
  published: number;                // số bài hẹn giờ vừa tới giờ & được đăng trong lượt này
  skipped: number;                  // tin đã nhập trước đó (trùng link/tiêu đề)
  warnings: string[];
  error?: string;
};

type StateDoc = { _id: string; run?: NewsAutoRun; until?: Date };

async function stateCol() {
  return (await getDb()).collection<StateDoc>("news_auto");
}

export async function getNewsAutoLastRun(): Promise<NewsAutoRun | null> {
  try {
    return (await (await stateCol()).findOne({ _id: "last" }))?.run ?? null;
  } catch {
    return null;
  }
}

// Khoá chống chạy chồng (cron + admin bấm cùng lúc). Hết hạn sau LOCK_MS phòng tiến trình chết giữa chừng.
const LOCK_MS = 6 * 60_000;
async function acquireLock(): Promise<boolean> {
  const now = new Date();
  try {
    await (await stateCol()).updateOne(
      { _id: "lock", $or: [{ until: { $lt: now } }, { until: { $exists: false } }] },
      { $set: { until: new Date(now.getTime() + LOCK_MS) } },
      { upsert: true },
    );
    return true;
  } catch {
    return false; // trùng _id (E11000) = đang có lượt khác giữ khoá
  }
}
async function releaseLock() {
  await (await stateCol()).updateOne({ _id: "lock" }, { $set: { until: new Date(0) } }).catch(() => {});
}

// Giờ VN cố định UTC+7 (không có giờ mùa hè).
const VN_OFFSET_MS = 7 * 3600_000;
function vnTodayAt(hour: number, now: Date): Date {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(), hour) - VN_OFFSET_MS);
}

// Mốc hẹn giờ đầu tiên: sau giờ bắt đầu hôm nay, sau "bây giờ" ít phút, và nối tiếp sau bài
// đang chờ đăng muộn nhất (để các lượt không dồn bài vào cùng một giờ).
async function firstSlot(startHour: number, intervalMs: number, now: Date): Promise<number> {
  const last = await (await articles())
    .find({ status: "draft", scheduledAt: { $gt: now } })
    .sort({ scheduledAt: -1 }).limit(1).project<{ scheduledAt: Date }>({ scheduledAt: 1 }).next();
  return Math.max(
    now.getTime() + 5 * 60_000,
    vnTodayAt(startHour, now).getTime(),
    last ? last.scheduledAt.getTime() + intervalMs : 0,
  );
}

// Ngân sách thời gian 1 lượt (route cho phép 300 giây) — dừng nhận tin mới khi gần hết.
const TIME_BUDGET_MS = 230_000;

export async function runNewsAuto(trigger: "cron" | "manual", opts: { force?: boolean } = {}): Promise<NewsAutoRun> {
  const started = Date.now();
  const s = await getSettingsRaw();
  const run: NewsAutoRun = {
    at: new Date(started).toISOString(), trigger, ok: false, mode: s.newsAutoMode,
    created: [], published: 0, skipped: 0, warnings: [],
  };

  // Luôn đăng các bài hẹn giờ đã tới hạn, kể cả khi tính năng đang tắt.
  run.published = await publishDueArticles().catch(() => 0);

  if (!s.newsAutoEnabled && !opts.force) {
    run.error = "Chưa bật tự động lấy tin (Cài đặt → Nguồn tin ngoài).";
    return run; // không ghi đè "lượt gần nhất" khi tắt
  }
  if (!(await externalNewsConfigured())) {
    run.error = "Nguồn tin ngoài chưa bật hoặc chưa cấu hình.";
    return save(run);
  }
  if (!(await acquireLock())) {
    run.error = "Đang có một lượt khác chạy — thử lại sau ít phút.";
    return run;
  }

  try {
    const useAi = configuredProviders(s).length > 0;
    if (!useAi) run.warnings.push("Chưa cấu hình AI — bài chỉ lấy văn bản thô và được giữ ở dạng nháp.");
    const category = await resolveNewsCategory(s.newsAutoCategory);

    const items = (await fetchExternalNews(undefined, 30)).filter((it) => it.url && it.title?.trim());
    // Bỏ tin đã nhập (trùng link gốc hoặc trùng tiêu đề).
    const col = await articles();
    const dup = await col
      .find({ $or: [{ sourceUrl: { $in: items.map((it) => it.url) } }, { title: { $in: items.map((it) => it.title.trim()) } }] })
      .project<{ sourceUrl?: string; title: string }>({ sourceUrl: 1, title: 1 })
      .toArray();
    const seenUrl = new Set(dup.map((d) => d.sourceUrl).filter(Boolean));
    const seenTitle = new Set(dup.map((d) => d.title.trim().toLowerCase()));
    const fresh = items.filter((it) => !seenUrl.has(it.url) && !seenTitle.has(it.title.trim().toLowerCase()));
    run.skipped = items.length - fresh.length;

    const now = new Date();
    const intervalMs = s.newsAutoIntervalHours * 3600_000;
    let slot = s.newsAutoMode === "schedule" ? await firstSlot(s.newsAutoStartHour, intervalMs, now) : 0;

    for (const it of fresh.slice(0, s.newsAutoCount)) {
      if (Date.now() - started > TIME_BUDGET_MS) {
        run.warnings.push("Hết thời gian cho lượt này — các tin còn lại sẽ lấy ở lượt sau.");
        break;
      }
      const built = await buildExternalArticle(it, { full: true, useAi, category });
      if (!built) continue;
      if (built.warning) run.warnings.push(built.warning);
      // Chỉ tự hẹn giờ đăng bài do AI viết lại; bài văn bản thô/bản ngắn giữ nháp cho admin xem.
      let scheduledAt: Date | null = null;
      if (s.newsAutoMode === "schedule") {
        if (built.usedAi) { scheduledAt = new Date(slot); slot += intervalMs; }
        else run.warnings.push(`“${built.input.title.slice(0, 60)}”: AI không viết lại được — giữ ở dạng nháp.`);
      }
      const doc = await createArticle({ ...built.input, scheduledAt });
      run.created.push({ slug: doc.slug, title: doc.title, scheduledAt: scheduledAt ? scheduledAt.toISOString() : null });
    }
    run.ok = true;
    if (!fresh.length) run.warnings.push("Không có tin mới so với lượt trước.");
  } catch (e) {
    run.error = e instanceof Error ? e.message : "Lỗi không xác định.";
  } finally {
    await releaseLock();
  }

  void logActivity({
    userId: null, userName: "Hệ thống (tự động)", userEmail: "", userRole: "system",
    category: "admin", action: "article.auto-import",
    target: { type: "bài viết", label: `${run.created.length} bài` },
    success: run.ok,
    detail: run.error ?? `${trigger === "cron" ? "Cron hằng ngày" : "Chạy tay"} · ${run.mode === "schedule" ? "hẹn giờ đăng" : "tạo nháp"}`,
  });
  return save(run);
}

async function save(run: NewsAutoRun): Promise<NewsAutoRun> {
  await (await stateCol()).updateOne({ _id: "last" }, { $set: { run } }, { upsert: true }).catch(() => {});
  return run;
}
