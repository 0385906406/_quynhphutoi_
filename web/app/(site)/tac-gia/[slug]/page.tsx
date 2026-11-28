import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxonomyPage } from "@/components/news/TaxonomyPage";
import { queryTaxonomy } from "@/lib/news-taxonomy";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ trang?: string }> };
const pageNum = (v?: string) => Math.max(1, parseInt(v ?? "1", 10) || 1);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug: slug } = await params; const { trang } = await searchParams;
  const r = await queryTaxonomy("author", slug, pageNum(trang));
  if (!r) return { title: "Không tìm thấy", robots: { index: false, follow: false } };
  const base = `/tac-gia/${slug}`;
  const label = r.term.name;
  return buildMetadata({
    title: r.page > 1 ? `${label} — Trang ${r.page}` : label,
    description: `Bài viết của ${r.term.name} trên Quỳnh Phụ Tôi.`,
    path: r.page > 1 ? `${base}?trang=${r.page}` : base,
    // Trang đầu index; trang sâu vẫn cho Google đi theo liên kết nhưng không index để tránh trùng.
    noindex: r.page > 1,
  });
}

export default async function Page({ params, searchParams }: Props) {
  const { slug: slug } = await params; const { trang } = await searchParams;
  const r = await queryTaxonomy("author", slug, pageNum(trang));
  if (!r) notFound();
  const intro = { title: r.authorInfo?.title, bio: undefined };
  return <TaxonomyPage kind="author" term={r.term} items={r.items} page={r.page} totalPages={r.totalPages} total={r.total} base={`/tac-gia/${slug}`} intro={intro} />;
}
