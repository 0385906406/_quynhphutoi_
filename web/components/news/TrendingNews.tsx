// "Tin nóng": bài được đọc nhiều nhất ~48 giờ qua. Server component — hiện ngay, không cần JS.
import Link from "next/link";
import { trendingArticles } from "@/lib/news-taxonomy";
import { fmtViews } from "@/lib/news";

export async function TrendingNews({ n = 5 }: { n?: number }) {
  const items = await trendingArticles(n).catch(() => []);
  if (items.length < 3) return null;
  return (
    <section className="qp-trending" aria-labelledby="trend-h">
      <h2 id="trend-h" className="qp-trending__title"><span aria-hidden>🔥</span> Tin nóng hôm nay</h2>
      <ol className="qp-trending__list">
        {items.map((a, i) => (
          <li key={a.id}>
            <span className="qp-trending__no" aria-hidden>{i + 1}</span>
            <div>
              <Link href={`/tin-tuc/${a.slug}`}>{a.title}</Link>
              <span className="qp-trending__meta">{a.category} · {fmtViews(a.views)}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
