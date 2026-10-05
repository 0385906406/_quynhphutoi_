// Nhập bài viết từ URL: tải trang → bóc nội dung → (tuỳ chọn) AI viết lại thành bài chuẩn.
// Dùng chung cho: API /api/admin/ai/import-url và "Viết bài ngay" ở Tạo tin từ nguồn ngoài.
// (Tách từ app/api/admin/ai/import-url/route.ts — giữ nguyên cách bóc HTML & prompt cũ.)
import { getSettingsRaw } from "@/lib/settings";
import { callAi, aiReadyFor, configuredProviders, type AiProvider } from "@/lib/ai-call";

export type UrlImportResult = {
  title: string;
  excerpt: string;
  bodyHtml: string;
  ogImage: string;
  tags: string;            // chuỗi, cách nhau dấu phẩy
  focusKeyword: string;    // từ khoá chính (AI gợi ý) — rỗng nếu không dùng AI
  sourceUrl: string;
  hostname: string;
  usedAi: boolean;
  social: boolean;
};

/** Lỗi có thông báo thân thiện + HTTP status để route trả thẳng cho client. */
export class UrlImportError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// ── HTML helpers (không dùng thư viện ngoài) ─────────────────────────────
const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", middot: "·", bull: "•", copy: "©",
};
// Giải mã cả mã số (&#x1EDD; / &#7901;) — nhiều báo (vd Tuổi Trẻ) viết tiếng Việt bằng mã số;
// trước đây chỉ giải vài mã có tên → tiêu đề/slug/nội dung bị hỏng ("triet-ph225-…").
function decodeHTMLEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return NAMED[code.toLowerCase()] ?? m;
  });
}
function getMeta(html: string, attr: string): string {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${attr}["'][^>]+content=["']([^"']+)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${attr}["']`, "i");
  const m = html.match(re1) || html.match(re2);
  return m ? decodeHTMLEntities(m[1].trim()) : "";
}
function getPageTitle(html: string): string {
  return getMeta(html, "og:title")
    || (() => { const m = html.match(/<title[^>]*>([^<]+)<\/title>/i); return m ? decodeHTMLEntities(m[1].trim()) : ""; })()
    || (() => { const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i); return m ? decodeHTMLEntities(m[1].trim()) : ""; })();
}
const getPageDesc = (html: string) => getMeta(html, "og:description") || getMeta(html, "description");

// Mạng xã hội render bằng JS — body fetch về chỉ là shell page, không có nội dung bài.
const SOCIAL_HOSTNAMES = /^(www\.)?(facebook|fb|instagram|threads|twitter|x|tiktok|linkedin|zalo)\.com$/i;

// Độ dài chữ của 1 khối HTML (bỏ thẻ) — để chọn khối chứa bài chính.
const textLen = (h: string) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").length;

function extractText(html: string): string {
  // Ưu tiên <article> NHIỀU CHỮ NHẤT (trang báo thường có nhiều <article> nhỏ cho tin liên quan —
  // lấy cái đầu tiên dễ trúng khối tin phụ) → <main> → <body>.
  const articles = Array.from(html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi), (m) => m[1]);
  const bestArticle = articles.sort((a, b) => textLen(b) - textLen(a))[0];
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  const picked = bestArticle && textLen(bestArticle) >= 800 ? bestArticle : (main ?? body ?? bestArticle ?? html);
  const chunk = picked
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    // Giữ ranh giới đoạn: hết đoạn/tiêu đề/mục danh sách/xuống dòng → 2 dấu xuống dòng.
    // (Trước đây gộp mọi khoảng trắng thành 1 dấu cách → cả bài thành MỘT đoạn duy nhất.)
    .replace(/<\/(p|h[1-6]|li|blockquote|div|section|tr)>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v\r]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return decodeHTMLEntities(chunk).slice(0, 8000);
}

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * @param useAi  false → chỉ bóc văn bản thô (vd biên tập viên không có quyền dùng AI).
 * @param provider bỏ trống → tự chọn provider AI đầu tiên đã cấu hình.
 */
export async function importArticleFromUrl(
  url: string,
  opts: { useAi?: boolean; provider?: AiProvider } = {},
): Promise<UrlImportResult> {
  let parsed: URL;
  try {
    parsed = new URL((url || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("protocol");
  } catch {
    throw new UrlImportError("URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://).");
  }
  const social = SOCIAL_HOSTNAMES.test(parsed.hostname);

  let pageHtml: string;
  try {
    const res = await fetch(parsed.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "vi,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new UrlImportError(`Trang trả về lỗi HTTP ${res.status}.`, 502);
    pageHtml = await res.text();
  } catch (e) {
    if (e instanceof UrlImportError) throw e;
    throw new UrlImportError(`Không thể tải trang: ${e instanceof Error ? e.message : "lỗi không xác định"}`, 502);
  }

  const rawTitle = getPageTitle(pageHtml);
  const rawDesc = getPageDesc(pageHtml);
  const ogImage = getMeta(pageHtml, "og:image");
  const bodyText = social ? "" : extractText(pageHtml);

  let title = rawTitle;
  let excerpt = rawDesc;
  let bodyHtml = "";
  let tags = "";
  let focusKeyword = "";
  let usedAi = false;

  if (opts.useAi !== false) {
    const settings = await getSettingsRaw();
    const provider = opts.provider && aiReadyFor(settings, opts.provider)
      ? opts.provider
      : configuredProviders(settings)[0];
    const canCallAi = !!provider && (social ? !!(rawTitle || rawDesc) : bodyText.trim().length > 100);

    if (canCallAi && provider) {
      const socialNote = social
        ? `Lưu ý: đây là bài đăng từ ${parsed.hostname}. Trang này render bằng JavaScript nên chỉ có meta tags. Hãy dựa vào tiêu đề và mô tả để viết bài đầy đủ.`
        : "";
      const contentSection = social ? "" : `\nNội dung gốc:\n${bodyText}`;
      const prompt = `Bạn là biên tập viên của "Quỳnh Phụ Tôi" — trang thông tin cộng đồng, phi chính thức, tại xã Quỳnh Phụ, Thái Bình.
${socialNote}
Hãy chuyển thể thành bài viết chuẩn cho trang, tối ưu SEO.

Trả về ĐÚNG JSON (không bọc markdown, không giải thích), cấu trúc:
{
  "title": "tiêu đề (40-60 ký tự, chứa từ khoá chính ở gần đầu)",
  "excerpt": "sapo/tóm tắt (120-160 ký tự, hấp dẫn, có từ khoá chính)",
  "focusKeyword": "từ khoá chính 2-5 âm tiết mà người đọc hay tìm trên Google",
  "bodyHtml": "nội dung HTML — chỉ dùng <h2>,<h3>,<p>,<ul>,<ol>,<li>,<strong>,<em>,<blockquote>. KHÔNG dùng <h1>. Có ít nhất 1 <h2> chứa từ khoá chính; nhắc từ khoá chính ở đoạn đầu",
  "tags": "3-5 tags tiếng Việt, cách nhau dấu phẩy"
}

Tiêu đề gốc: ${rawTitle || "(không có)"}
Mô tả gốc: ${rawDesc || "(không có)"}
Nguồn: ${parsed.hostname}${contentSection}

Bắt đầu JSON ngay từ dấu {`;
      try {
        let raw = await callAi(prompt, settings, provider);
        raw = raw.replace(/^```json?\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const s = raw.indexOf("{");
        const e = raw.lastIndexOf("}");
        if (s !== -1 && e > s) {
          const j = JSON.parse(raw.slice(s, e + 1));
          title = j.title || title;
          excerpt = j.excerpt || excerpt;
          bodyHtml = j.bodyHtml || "";
          tags = j.tags || "";
          focusKeyword = typeof j.focusKeyword === "string" ? j.focusKeyword.trim() : "";
          usedAi = true;
        }
      } catch { /* fallback bên dưới */ }
    }
  }

  // Không có AI (hoặc AI lỗi) → dùng văn bản thô của trang
  if (!bodyHtml && bodyText) {
    // Bỏ dòng vụn (menu, ngày giờ, "Chia sẻ"…) — giữ đoạn có ít nhất ~8 âm tiết.
    bodyHtml = bodyText.split(/\n{2,}/).map((p) => p.trim())
      .filter((p) => p.split(/\s+/).length >= 8)
      .map((p) => `<p>${escHtml(p)}</p>`).join("\n");
  }
  if (social && !usedAi && !bodyHtml) {
    throw new UrlImportError(
      `Bài đăng từ ${parsed.hostname} cần AI để xử lý (trang này không cho phép đọc nội dung trực tiếp). Vào Cài đặt → AI & nội dung để cấu hình provider.`,
      422,
    );
  }

  return { title, excerpt, bodyHtml, ogImage, tags, focusKeyword, sourceUrl: parsed.href, hostname: parsed.hostname, usedAi, social };
}
