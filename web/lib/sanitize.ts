// Làm sạch HTML từ rich text editor (Tiptap) trước khi lưu — chống XSS.
// Theo cách dự án innovation: isomorphic-dompurify với allowlist + hook.
import DOMPurify from "isomorphic-dompurify";

// Thẻ định dạng phong phú khớp toolbar editor (heading, bảng, ảnh, YouTube,
// task list, details, sub/sup, màu…). Iframe chỉ cho YouTube (lọc ở hook).
const ALLOWED_TAGS = [
  "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s", "strike", "mark", "sub", "sup",
  "h1", "h2", "h3", "h4", "ul", "ol", "li", "label", "input",
  "blockquote", "a", "code", "pre", "hr", "img", "iframe",
  "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
  "details", "summary",
];
const ALLOWED_ATTR = [
  "href", "target", "rel", "src", "alt", "title", "width", "height", "loading", "class", "style",
  "data-type", "data-checked", "colspan", "rowspan", "start", "type", "checked", "disabled",
  "allow", "allowfullscreen", "frameborder",
];

// Hook chạy 1 lần: iframe ngoài YouTube → xoá; input task-list → ép disabled.
let hooked = false;
function ensureHook() {
  if (hooked) return;
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    const el = node as unknown as Element;
    if (data.tagName === "iframe") {
      const src = el.getAttribute?.("src") || "";
      const ok = /^https:\/\/(www\.)?(youtube(-nocookie)?\.com|youtu\.be)\//i.test(src);
      if (!ok) el.parentNode?.removeChild(el);
    }
    if (data.tagName === "input") {
      el.setAttribute?.("disabled", "disabled");
    }
  });
  hooked = true;
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  ensureHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    ADD_TAGS: ["iframe"],
  }).trim();
}

// Bỏ thẻ HTML → text thuần, dùng cho preview (thẻ tin, danh sách duyệt).
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre|br|tr)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
