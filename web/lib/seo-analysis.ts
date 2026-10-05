// Phân tích SEO on-page cho bài viết — kiểu "Yoast SEO" nhưng VIẾT CHO TIẾNG VIỆT:
//  • So khớp từ khoá KHÔNG phân biệt dấu/hoa thường ("quỳnh phụ" ≈ "Quynh Phu").
//  • Đếm theo ÂM TIẾT (tiếng Việt tách bằng khoảng trắng theo âm tiết) — ngưỡng độ dài
//    câu/đoạn/bài đã quy đổi (≈ 1,3 âm tiết / từ tiếng Anh).
// Thuần TypeScript, không phụ thuộc thư viện → chạy trực tiếp trong trình soạn (client) khi gõ,
// và dùng được cả phía server. (Không dùng gói yoastseo: GPL-3.0 + không hỗ trợ tiếng Việt.)
import { slugify } from "@/lib/slug";

export type CheckStatus = "good" | "ok" | "bad";
export type CheckGroup = "seo" | "readability";
export type SeoCheck = {
  id: string;
  group: CheckGroup;
  status: CheckStatus;
  label: string;      // tên tiêu chí
  message: string;    // kết quả + cách sửa
  weight: number;
};

export type SeoAnalysisInput = {
  title: string;
  slug?: string;              // slug hiện có (khi sửa); trống → suy từ tiêu đề
  excerpt?: string;           // sapo
  bodyHtml: string;
  focusKeyword?: string;
  metaTitle?: string;         // trống → dùng title
  metaDescription?: string;   // trống → dùng excerpt
  tags?: string[];
  coverImage?: string;
  coverAlt?: string;
  noindex?: boolean;
  siteHost?: string;          // để nhận diện liên kết nội bộ dạng tuyệt đối
};

export type SeoAnalysis = {
  checks: SeoCheck[];
  seoScore: number;           // 0–100
  readabilityScore: number;   // 0–100
  total: number;              // 0–100 (SEO 75% + dễ đọc 25%)
  stats: {
    words: number; sentences: number; paragraphs: number; headings: number;
    keywordCount: number; density: number; internalLinks: number; externalLinks: number;
    images: number; imagesMissingAlt: number;
    metaTitle: string; metaDescription: string; slug: string;
  };
};

// ── Chuẩn hoá tiếng Việt: bỏ dấu, đ→d, thường, bỏ ký tự đặc biệt, gom khoảng trắng ──
export function normalizeVi(s: string): string {
  return (s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const decodeEntities = (s: string) =>
  s.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

// Số lần cụm từ khoá xuất hiện (khớp nguyên âm tiết, không dính chữ khác).
function countPhrase(haystackNorm: string, kwNorm: string): number {
  if (!kwNorm) return 0;
  const hay = ` ${haystackNorm} `;
  const needle = ` ${kwNorm} `;
  let n = 0, i = hay.indexOf(needle);
  while (i !== -1) { n++; i = hay.indexOf(needle, i + needle.length - 1); }
  return n;
}
const hasPhrase = (text: string, kwNorm: string) => countPhrase(normalizeVi(text), kwNorm) > 0;

// Tách đoạn văn (p, li, blockquote) từ HTML trình soạn.
function paragraphsOf(html: string): string[] {
  const blocks = html.match(/<(p|li|blockquote)\b[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const out = blocks.map(stripTags).filter(Boolean);
  if (out.length) return out;
  const plain = stripTags(html);
  return plain ? [plain] : [];
}
const sentencesOf = (text: string) =>
  text.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter((s) => countWords(s) > 0);

// Ngưỡng (âm tiết)
const LONG_SENTENCE = 30;     // ~ 23 từ tiếng Anh
const LONG_PARAGRAPH = 150;
const SECTION_MAX = 350;      // số âm tiết tối đa giữa 2 tiêu đề phụ

export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysis {
  const kw = (input.focusKeyword || "").trim();
  const kwNorm = normalizeVi(kw);
  const kwWords = kwNorm ? kwNorm.split(" ").length : 0;
  const html = input.bodyHtml || "";
  const bodyText = stripTags(html);
  const bodyNorm = normalizeVi(bodyText);
  const words = countWords(bodyText);
  const metaTitle = (input.metaTitle || "").trim() || (input.title || "").trim();
  const metaDescription = (input.metaDescription || "").trim() || (input.excerpt || "").trim();
  const slug = (input.slug || "").trim() || slugify(input.title || "");
  const paragraphs = paragraphsOf(html);
  const sentences = paragraphs.flatMap(sentencesOf);
  const headingTexts = (html.match(/<h[2-4]\b[^>]*>[\s\S]*?<\/h[2-4]>/gi) ?? []).map(stripTags);

  // Liên kết
  const hrefs = Array.from(html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi), (m) => m[1].trim());
  const host = (input.siteHost || "").replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const isInternal = (h: string) => h.startsWith("/") || h.startsWith("#") || (!!host && h.toLowerCase().includes(host));
  const internalLinks = hrefs.filter(isInternal).length;
  const externalLinks = hrefs.filter((h) => /^https?:\/\//i.test(h) && !isInternal(h)).length;

  // Ảnh trong bài
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const altOf = (tag: string) => (tag.match(/\salt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").trim();
  const imagesMissingAlt = imgTags.filter((t) => !altOf(t)).length;
  const allAlts = [input.coverAlt || "", ...imgTags.map(altOf)];

  const keywordCount = countPhrase(bodyNorm, kwNorm);
  // Mật độ = số lần xuất hiện / tổng âm tiết (cách tính của Yoast) — KHÔNG nhân số âm tiết của
  // từ khoá, nếu không cụm từ dài tiếng Việt (4–5 âm tiết) sẽ luôn bị báo "nhồi từ khoá".
  const density = words && kwWords ? (keywordCount * 100) / words : 0;

  const checks: SeoCheck[] = [];
  const add = (c: SeoCheck) => checks.push(c);

  // ───────────────────────── NHÓM SEO ─────────────────────────
  if (!kw) {
    add({ id: "kw", group: "seo", status: "bad", weight: 10, label: "Từ khoá chính",
      message: "Chưa đặt từ khoá chính. Nhập cụm từ người dân hay tìm trên Google (vd: “lịch cắt điện Quỳnh Phụ”)." });
  } else if (kwWords > 5) {
    add({ id: "kw", group: "seo", status: "ok", weight: 10, label: "Từ khoá chính",
      message: `Từ khoá dài ${kwWords} âm tiết — nên gọn 2–5 âm tiết để dễ khớp tìm kiếm.` });
  } else {
    add({ id: "kw", group: "seo", status: "good", weight: 10, label: "Từ khoá chính", message: `Đã đặt: “${kw}”.` });
  }

  if (kwNorm) {
    // Tiêu đề SEO
    const tNorm = normalizeVi(metaTitle);
    const pos = (` ${tNorm} `).indexOf(` ${kwNorm} `);
    add(pos === -1
      ? { id: "kw-title", group: "seo", status: "bad", weight: 10, label: "Từ khoá trong tiêu đề", message: "Tiêu đề (SEO) chưa chứa từ khoá chính." }
      : pos <= tNorm.length / 3
        ? { id: "kw-title", group: "seo", status: "good", weight: 10, label: "Từ khoá trong tiêu đề", message: "Từ khoá nằm ở đầu tiêu đề — rất tốt." }
        : { id: "kw-title", group: "seo", status: "ok", weight: 10, label: "Từ khoá trong tiêu đề", message: "Có từ khoá trong tiêu đề — nên đưa lên gần đầu." });

    add(hasPhrase(metaDescription, kwNorm)
      ? { id: "kw-desc", group: "seo", status: "good", weight: 6, label: "Từ khoá trong mô tả", message: "Mô tả (meta description/sapo) có chứa từ khoá." }
      : { id: "kw-desc", group: "seo", status: "bad", weight: 6, label: "Từ khoá trong mô tả", message: "Mô tả hiển thị trên Google chưa có từ khoá chính." });

    const intro = [input.excerpt || "", ...paragraphs.slice(0, 2)].join(" ");
    add(hasPhrase(intro, kwNorm)
      ? { id: "kw-intro", group: "seo", status: "good", weight: 6, label: "Từ khoá ở đoạn mở đầu", message: "Từ khoá xuất hiện ngay phần mở đầu." }
      : { id: "kw-intro", group: "seo", status: "bad", weight: 6, label: "Từ khoá ở đoạn mở đầu", message: "Nên nhắc từ khoá trong sapo hoặc đoạn đầu tiên." });

    const kwSlug = slugify(kw);
    add(kwSlug && (`-${slug}-`).includes(`-${kwSlug}-`)
      ? { id: "kw-slug", group: "seo", status: "good", weight: 4, label: "Từ khoá trong đường dẫn", message: `Đường dẫn /${slug} chứa từ khoá.` }
      : { id: "kw-slug", group: "seo", status: "ok", weight: 4, label: "Từ khoá trong đường dẫn", message: "Đường dẫn (tạo từ tiêu đề) chưa chứa từ khoá — đưa từ khoá vào tiêu đề để đường dẫn có luôn." });

    if (words >= 100) {
      const d = Math.round(density * 10) / 10;
      add(keywordCount === 0
        ? { id: "kw-density", group: "seo", status: "bad", weight: 6, label: "Mật độ từ khoá", message: "Nội dung chưa nhắc từ khoá lần nào." }
        : density < 0.5
          ? { id: "kw-density", group: "seo", status: "ok", weight: 6, label: "Mật độ từ khoá", message: `${keywordCount} lần (${d}%) — hơi ít, nên 0,5–2,5%.` }
          : density > 2.5
            ? { id: "kw-density", group: "seo", status: "bad", weight: 6, label: "Mật độ từ khoá", message: `${keywordCount} lần (${d}%) — quá dày, dễ bị coi là nhồi từ khoá. Nên ≤ 2,5%.` }
            : { id: "kw-density", group: "seo", status: "good", weight: 6, label: "Mật độ từ khoá", message: `${keywordCount} lần (${d}%) — vừa đẹp.` });
    }

    if (headingTexts.length) {
      add(headingTexts.some((h) => hasPhrase(h, kwNorm))
        ? { id: "kw-heading", group: "seo", status: "good", weight: 4, label: "Từ khoá trong tiêu đề phụ", message: "Có tiêu đề phụ (H2/H3) chứa từ khoá." }
        : { id: "kw-heading", group: "seo", status: "ok", weight: 4, label: "Từ khoá trong tiêu đề phụ", message: "Nên có ít nhất 1 tiêu đề phụ (H2/H3) chứa từ khoá." });
    }

    add(allAlts.some((a) => hasPhrase(a, kwNorm))
      ? { id: "kw-alt", group: "seo", status: "good", weight: 3, label: "Từ khoá trong mô tả ảnh", message: "Có ảnh mà mô tả (alt) chứa từ khoá." }
      : { id: "kw-alt", group: "seo", status: "ok", weight: 3, label: "Từ khoá trong mô tả ảnh", message: "Nên đưa từ khoá vào mô tả ảnh bìa (alt)." });
  }

  // Độ dài tiêu đề SEO (Google cắt ~60 ký tự)
  const tl = metaTitle.length;
  add(!tl
    ? { id: "title-len", group: "seo", status: "bad", weight: 6, label: "Độ dài tiêu đề", message: "Chưa có tiêu đề." }
    : tl >= 40 && tl <= 60
      ? { id: "title-len", group: "seo", status: "good", weight: 6, label: "Độ dài tiêu đề", message: `${tl} ký tự — hiển thị trọn trên Google.` }
      : tl < 40
        ? { id: "title-len", group: "seo", status: tl >= 25 ? "ok" : "bad", weight: 6, label: "Độ dài tiêu đề", message: `${tl} ký tự — hơi ngắn, nên 40–60 ký tự.` }
        : { id: "title-len", group: "seo", status: tl <= 70 ? "ok" : "bad", weight: 6, label: "Độ dài tiêu đề", message: `${tl} ký tự — Google sẽ cắt bớt (nên ≤ 60). Có thể nhập “Meta title” ngắn hơn.` });

  const dl = metaDescription.length;
  add(!dl
    ? { id: "desc-len", group: "seo", status: "bad", weight: 6, label: "Mô tả (meta description)", message: "Chưa có sapo/mô tả — Google sẽ tự cắt một đoạn bất kỳ." }
    : dl >= 120 && dl <= 160
      ? { id: "desc-len", group: "seo", status: "good", weight: 6, label: "Mô tả (meta description)", message: `${dl} ký tự — vừa đẹp.` }
      : dl < 120
        ? { id: "desc-len", group: "seo", status: dl >= 70 ? "ok" : "bad", weight: 6, label: "Mô tả (meta description)", message: `${dl} ký tự — nên 120–160 ký tự.` }
        : { id: "desc-len", group: "seo", status: dl <= 200 ? "ok" : "bad", weight: 6, label: "Mô tả (meta description)", message: `${dl} ký tự — sẽ bị cắt (nên ≤ 160).` });

  add(words >= 500
    ? { id: "length", group: "seo", status: "good", weight: 8, label: "Độ dài nội dung", message: `${words} âm tiết — đủ sâu để Google đánh giá cao.` }
    : words >= 300
      ? { id: "length", group: "seo", status: "ok", weight: 8, label: "Độ dài nội dung", message: `${words} âm tiết — tạm, nên ≥ 500 âm tiết.` }
      : { id: "length", group: "seo", status: "bad", weight: 8, label: "Độ dài nội dung", message: `${words} âm tiết — quá ngắn (nên ≥ 300, tốt nhất ≥ 500).` });

  add(internalLinks > 0
    ? { id: "links-int", group: "seo", status: "good", weight: 4, label: "Liên kết nội bộ", message: `${internalLinks} liên kết tới trang khác trong site.` }
    : { id: "links-int", group: "seo", status: "ok", weight: 4, label: "Liên kết nội bộ", message: "Chưa có liên kết tới bài/trang khác của site — thêm 1–3 liên kết liên quan." });

  add(externalLinks > 0
    ? { id: "links-ext", group: "seo", status: "good", weight: 2, label: "Liên kết nguồn ngoài", message: `${externalLinks} liên kết tới nguồn bên ngoài.` }
    : { id: "links-ext", group: "seo", status: "ok", weight: 2, label: "Liên kết nguồn ngoài", message: "Có thể dẫn nguồn chính thức (cổng tỉnh, văn bản…) để tăng độ tin cậy." });

  add(!input.coverImage
    ? { id: "cover", group: "seo", status: "bad", weight: 5, label: "Ảnh bìa", message: "Chưa có ảnh bìa — bài chia sẻ Facebook/Zalo sẽ không có ảnh." }
    : !(input.coverAlt || "").trim()
      ? { id: "cover", group: "seo", status: "ok", weight: 5, label: "Ảnh bìa", message: "Có ảnh bìa nhưng chưa có mô tả ảnh (alt)." }
      : { id: "cover", group: "seo", status: "good", weight: 5, label: "Ảnh bìa", message: "Có ảnh bìa và mô tả ảnh." });

  if (imgTags.length) {
    add(imagesMissingAlt === 0
      ? { id: "img-alt", group: "seo", status: "good", weight: 3, label: "Mô tả ảnh trong bài", message: `Cả ${imgTags.length} ảnh đều có mô tả (alt).` }
      : { id: "img-alt", group: "seo", status: "ok", weight: 3, label: "Mô tả ảnh trong bài", message: `${imagesMissingAlt}/${imgTags.length} ảnh chưa có mô tả (alt).` });
  }

  const tagCount = (input.tags ?? []).filter(Boolean).length;
  add(tagCount >= 3 && tagCount <= 8
    ? { id: "tags", group: "seo", status: "good", weight: 2, label: "Thẻ (tags)", message: `${tagCount} thẻ.` }
    : { id: "tags", group: "seo", status: "ok", weight: 2, label: "Thẻ (tags)", message: tagCount ? `${tagCount} thẻ — nên 3–8 thẻ.` : "Chưa có thẻ — thêm 3–8 thẻ chủ đề." });

  if (input.noindex) {
    add({ id: "noindex", group: "seo", status: "bad", weight: 10, label: "Cho phép Google lập chỉ mục",
      message: "Đang bật “Ẩn khỏi Google (noindex)” — bài sẽ KHÔNG xuất hiện trên Google." });
  }

  // ─────────────────────── NHÓM DỄ ĐỌC ───────────────────────
  add((input.excerpt || "").trim()
    ? { id: "sapo", group: "readability", status: "good", weight: 4, label: "Sapo (tóm tắt)", message: "Có sapo dẫn dắt người đọc." }
    : { id: "sapo", group: "readability", status: "bad", weight: 4, label: "Sapo (tóm tắt)", message: "Chưa có sapo — 1–2 câu tóm tắt giúp người đọc & Google nắm ý chính." });

  if (words > SECTION_MAX) {
    // Chia bài theo tiêu đề phụ, tìm đoạn dài nhất không có tiêu đề
    const sections = html.split(/<h[2-4]\b[^>]*>/i).map((s) => countWords(stripTags(s)));
    const longest = Math.max(...sections);
    add(!headingTexts.length
      ? { id: "subheadings", group: "readability", status: "bad", weight: 5, label: "Tiêu đề phụ", message: "Bài dài nhưng chưa có tiêu đề phụ (H2/H3) — chia mục cho dễ đọc." }
      : longest > SECTION_MAX
        ? { id: "subheadings", group: "readability", status: "ok", weight: 5, label: "Tiêu đề phụ", message: `Có 1 phần dài ${longest} âm tiết không có tiêu đề phụ — nên ≤ ${SECTION_MAX}.` }
        : { id: "subheadings", group: "readability", status: "good", weight: 5, label: "Tiêu đề phụ", message: `${headingTexts.length} tiêu đề phụ, chia mục hợp lý.` });
  }

  if (paragraphs.length) {
    const longParas = paragraphs.filter((p) => countWords(p) > LONG_PARAGRAPH).length;
    add(longParas === 0
      ? { id: "para", group: "readability", status: "good", weight: 3, label: "Độ dài đoạn văn", message: "Các đoạn văn ngắn gọn, dễ đọc trên điện thoại." }
      : { id: "para", group: "readability", status: "ok", weight: 3, label: "Độ dài đoạn văn", message: `${longParas} đoạn dài hơn ${LONG_PARAGRAPH} âm tiết — nên tách nhỏ.` });
  }

  if (sentences.length >= 5) {
    const longRatio = sentences.filter((s) => countWords(s) > LONG_SENTENCE).length / sentences.length;
    const pct = Math.round(longRatio * 100);
    add(longRatio <= 0.25
      ? { id: "sentence", group: "readability", status: "good", weight: 3, label: "Độ dài câu", message: `${pct}% câu dài — câu văn gọn.` }
      : { id: "sentence", group: "readability", status: longRatio <= 0.4 ? "ok" : "bad", weight: 3, label: "Độ dài câu",
          message: `${pct}% câu dài hơn ${LONG_SENTENCE} âm tiết — nên ≤ 25%, tách câu dài.` });
  }

  // ── Điểm ──
  const score = (g: CheckGroup) => {
    const list = checks.filter((c) => c.group === g);
    const max = list.reduce((s, c) => s + c.weight, 0);
    if (!max) return 0;
    const got = list.reduce((s, c) => s + c.weight * (c.status === "good" ? 1 : c.status === "ok" ? 0.5 : 0), 0);
    return Math.round((got / max) * 100);
  };
  const seoScore = score("seo");
  const readabilityScore = score("readability");
  // Bài trống → 0 (tránh điểm "ảo" từ các tiêu chí mặc định)
  const total = !words && !(input.title || "").trim() ? 0 : Math.round(seoScore * 0.75 + readabilityScore * 0.25);

  return {
    checks, seoScore, readabilityScore, total,
    stats: {
      words, sentences: sentences.length, paragraphs: paragraphs.length, headings: headingTexts.length,
      keywordCount, density, internalLinks, externalLinks, images: imgTags.length, imagesMissingAlt,
      metaTitle, metaDescription, slug,
    },
  };
}

export const scoreColor = (n: number): "green" | "yellow" | "red" => (n >= 80 ? "green" : n >= 55 ? "yellow" : "red");
