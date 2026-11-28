import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { listArticles } from "@/lib/articles";
import { listJobs } from "@/lib/jobs";
import { listClassifieds } from "@/lib/classifieds";
import { listPosts } from "@/lib/lostfound";
import { listSchools } from "@/lib/schools";
import { listHealth } from "@/lib/health";
import { listTransit } from "@/lib/transit";
import { listRelics } from "@/lib/relics";
import { listMarket } from "@/lib/market";
import { listCategories, listTags, listAuthors } from "@/lib/news-taxonomy";

// Đọc DB tại thời điểm request — luôn tươi.
export const dynamic = "force-dynamic";

type Row = { slug: string; updatedAt?: Date; createdAt?: Date; publishedAt?: Date | null };
const url = (path: string) => `${SITE.url}${path}`;

// Gọi 1 hàm list → biến thành các entry sitemap; lỗi 1 module không làm hỏng toàn bộ.
async function entries(
  prefix: string,
  fetcher: () => Promise<Row[]>,
  priority = 0.7,
): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await fetcher();
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        url: url(`${prefix}/${r.slug}`),
        lastModified: r.updatedAt || r.publishedAt || r.createdAt || new Date(),
        changeFrequency: "weekly" as const,
        priority,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Trang tĩnh + danh sách module (KHÔNG gồm trang noindex: quang-cao, tim-kiem, tai-khoan, thong-bao).
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["/tin-tuc", "/viec-lam", "/mua-ban", "/tim-do-roi", "/truong-hoc", "/y-te", "/giao-thong", "/di-tich", "/cho"].map(
      (p) => ({ url: url(p), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }),
    ),
    ...["/xo-so", "/bong-da", "/gia-vang"].map(
      (p) => ({ url: url(p), lastModified: now, changeFrequency: "hourly" as const, priority: 0.8 }),
    ),
    ...["/tong-quan", "/sap-nhap", "/lien-he", "/noi-quy"].map(
      (p) => ({ url: url(p), lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 }),
    ),
  ];
  // /thoi-tiet trả 404 khi admin tắt module thời tiết → chỉ liệt kê khi đang bật.
  const weatherOn = await getSettings().then((s) => s.weatherEnabled).catch(() => false);
  if (weatherOn) staticRoutes.push({ url: url("/thoi-tiet"), lastModified: now, changeFrequency: "hourly", priority: 0.5 });

  const dynamicGroups = await Promise.all([
    entries("/tin-tuc", () => listArticles({ status: "published" }) as Promise<Row[]>, 0.8),
    entries("/viec-lam", () => listJobs({ approvedOnly: true }) as Promise<Row[]>, 0.7),
    entries("/mua-ban", () => listClassifieds({ approvedOnly: true }) as Promise<Row[]>, 0.6),
    entries("/tim-do-roi", () => listPosts({ approvedOnly: true }) as Promise<Row[]>, 0.6),
    entries("/truong-hoc", () => listSchools({ activeOnly: true }) as Promise<Row[]>, 0.7),
    entries("/y-te", () => listHealth({ activeOnly: true }) as Promise<Row[]>, 0.7),
    entries("/giao-thong", () => listTransit({ activeOnly: true }) as Promise<Row[]>, 0.6),
    entries("/di-tich", () => listRelics({ activeOnly: true }) as Promise<Row[]>, 0.7),
    entries("/cho", () => listMarket({ activeOnly: true }) as Promise<Row[]>, 0.6),
  ]);

  // Trang chuyên mục / chủ đề / tác giả — mỗi trang có địa chỉ riêng để Google xếp hạng.
  const taxo = async (prefix: string, fetcher: () => Promise<{ slug: string }[]>, priority: number): Promise<MetadataRoute.Sitemap> => {
    try { return (await fetcher()).map((t) => ({ url: url(`${prefix}/${t.slug}`), lastModified: now, changeFrequency: "daily" as const, priority })); } catch { return []; }
  };
  const taxoGroups = await Promise.all([
    taxo("/tin-tuc/chuyen-muc", listCategories, 0.7),
    taxo("/tin-tuc/tag", async () => (await listTags()).filter((t) => t.count >= 2), 0.5),
    taxo("/tac-gia", listAuthors, 0.4),
  ]);

  return [...staticRoutes, ...dynamicGroups.flat(), ...taxoGroups.flat()];
}
