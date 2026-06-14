import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { listArticles } from "@/lib/articles";
import { listJobs } from "@/lib/jobs";
import { listClassifieds } from "@/lib/classifieds";
import { listPosts } from "@/lib/lostfound";
import { listSchools } from "@/lib/schools";
import { listHealth } from "@/lib/health";
import { listTransit } from "@/lib/transit";
import { listRelics } from "@/lib/relics";
import { listMarket } from "@/lib/market";

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
    ...["/tong-quan", "/sap-nhap", "/lien-he"].map(
      (p) => ({ url: url(p), lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 }),
    ),
  ];

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

  return [...staticRoutes, ...dynamicGroups.flat()];
}
