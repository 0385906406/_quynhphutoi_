// Bỏ thẻ HTML → text thuần, dùng cho preview (thẻ tin, danh sách duyệt), meta
// description và tìm kiếm. CỐ Ý tách khỏi lib/sanitize.ts: file này KHÔNG import
// isomorphic-dompurify (kéo theo jsdom). Trên serverless (Vercel/Node 20) việc nạp
// jsdom có thể ném ERR_REQUIRE_ESM (html-encoding-sniffer require ESM @exodus/bytes),
// làm hỏng MỌI trang chỉ vì lỡ import chung file — trong khi stripHtml chỉ là regex.
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
