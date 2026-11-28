import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyPage } from "@/components/news/TaxonomyPage";
import { queryTaxonomy, listCategories } from "@/lib/news-taxonomy";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ cat: string }>; searchParams: Promise<{ trang?: string }> };
const pageNum = (v?: string) => Math.max(1, parseInt(v ?? "1", 10) || 1);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { cat: slug } = await params; const { trang } = await searchParams;
  const r = await queryTaxonomy("category", slug, pageNum(trang));
  if (!r) return { title: "Không tìm thấy", robots: { index: false, follow: false } };
  const base = `/tin-tuc/chuyen-muc/${slug}`;
  const label = r.term.name;
  return buildMetadata({
    title: r.page > 1 ? `${label} — Trang ${r.page}` : label,
    description: `Tin ${r.term.name.toLowerCase()} tại xã Quỳnh Phụ — các bài viết, thông báo và hoạt động mới nhất.`,
    path: r.page > 1 ? `${base}?trang=${r.page}` : base,
    // Trang đầu index; trang sâu vẫn cho Google đi theo liên kết nhưng không index để tránh trùng.
    noindex: r.page > 1,
  });
}

export default async function Page({ params, searchParams }: Props) {
  const { cat: slug } = await params; const { trang } = await searchParams;
  const r = await queryTaxonomy("category", slug, pageNum(trang));
  if (!r) notFound();
  const chips = await listCategories();
  return <TaxonomyPage kind="category" term={r.term} items={r.items} page={r.page} totalPages={r.totalPages} total={r.total} base={`/tin-tuc/chuyen-muc/${slug}`} chips={chips} chipBase="/tin-tuc/chuyen-muc" />;
}
