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

// stripHtml ĐÃ CHUYỂN sang lib/strip-html.ts (regex thuần, không kéo jsdom).
// Re-export để các import cũ `from "@/lib/sanitize"` không gãy — NHƯNG lưu ý:
// import từ đây vẫn nạp isomorphic-dompurify ở trên. Đường chỉ-đọc nên import
// trực tiếp từ "@/lib/strip-html" để tránh jsdom (xem ERR_REQUIRE_ESM trên Vercel).
export { stripHtml } from "./strip-html";
