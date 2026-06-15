// Làm sạch HTML từ rich text editor (Tiptap) trước khi lưu — chống XSS.
// Dùng sanitize-html (thuần JS, htmlparser2) — CỐ Ý KHÔNG dùng isomorphic-dompurify
// vì nó kéo theo jsdom → html-encoding-sniffer require ESM @exodus/bytes → ERR_REQUIRE_ESM
// làm crash route trên Vercel (xem lib/strip-html.ts). sanitize-html không phụ thuộc jsdom.
import sanitizeHtmlLib from "sanitize-html";

// Thẻ định dạng phong phú khớp toolbar editor (heading, bảng, ảnh, YouTube,
// task list, details, sub/sup, màu…). Iframe chỉ cho YouTube (lọc theo hostname).
const ALLOWED_TAGS = [
  "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s", "strike", "mark", "sub", "sup",
  "h1", "h2", "h3", "h4", "ul", "ol", "li", "label", "input",
  "blockquote", "a", "code", "pre", "hr", "img", "iframe",
  "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
  "details", "summary",
];

// Chỉ cho nhúng iframe từ YouTube (kèm bản nocookie & link rút gọn youtu.be).
const YT_HOSTS = ["youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"];

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class", "style", "title", "data-type", "data-checked"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
      input: ["type", "checked", "disabled"],
      ol: ["start"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      col: ["span", "width"],
      colgroup: ["span"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    // Chỉ giữ iframe có hostname thuộc YouTube; còn lại bị loại bỏ.
    allowedIframeHostnames: YT_HOSTS,
    allowIframeRelativeUrls: false,
    transformTags: {
      // input task-list → ép disabled (chỉ để hiển thị, không cho tương tác).
      input: (tagName, attribs) => ({ tagName, attribs: { ...attribs, disabled: "disabled" } }),
    },
    // iframe ngoài YouTube đã bị gỡ src ở trên → loại bỏ luôn thẻ rỗng còn lại.
    exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
  }).trim();
}

// stripHtml ĐÃ CHUYỂN sang lib/strip-html.ts (regex thuần). Re-export để các import
// cũ `from "@/lib/sanitize"` không gãy. File này KHÔNG còn kéo jsdom nữa.
export { stripHtml } from "./strip-html";
