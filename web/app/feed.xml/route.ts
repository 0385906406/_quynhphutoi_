// RSS 2.0 cho Tin tức — /feed.xml. Lấy bài đã xuất bản & đã duyệt từ DB.
import { SITE } from "@/lib/seo";
import { listArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const docs = await listArticles({ status: "published", limit: 50 }).catch(() => []);
  const items = docs.map((a) => {
    const link = `${SITE.url}/tin-tuc/${a.slug}`;
    const date = (a.publishedAt ?? a.createdAt ?? new Date()).toUTCString();
    return `    <item>
      <title>${esc(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      <category>${esc(a.category ?? "")}</category>
      <description>${esc(a.excerpt ?? "")}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — Tin tức</title>
    <link>${SITE.url}/tin-tuc</link>
    <description>${esc(SITE.description)}</description>
    <language>vi-VN</language>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
