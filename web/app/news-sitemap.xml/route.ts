// Google News sitemap — chỉ bài xuất bản trong 48 giờ gần nhất (đúng chuẩn Google News), /news-sitemap.xml.
import { SITE } from "@/lib/seo";
import { recentForNewsSitemap } from "@/lib/news-taxonomy";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const docs = await recentForNewsSitemap(48).catch(() => []);
  const urls = docs.map((a) => `  <url>
    <loc>${SITE.url}/tin-tuc/${esc(a.slug)}</loc>
    <news:news>
      <news:publication><news:name>${esc(SITE.name)}</news:name><news:language>vi</news:language></news:publication>
      <news:publication_date>${(a.publishedAt ?? a.createdAt).toISOString()}</news:publication_date>
      <news:title>${esc(a.title)}</news:title>
    </news:news>
  </url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
