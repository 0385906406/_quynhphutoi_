import { pageMetadata } from "@/lib/page-seo";
import { JsonLd } from "@/components/common/JsonLd";
import { jsonLdBreadcrumb } from "@/lib/seo";
import Link from "next/link";
import { NewsBrowser } from "@/components/news/NewsBrowser";
import { listArticles, listMyArticles, toNewsCardArticle } from "@/lib/articles";
import { getNewsPageConfig, resolveNewsBlocks, autoNewsBlocks } from "@/lib/news-page";
import { getSession } from "@/lib/auth";
import type { Article } from "@/lib/news";

export async function generateMetadata() {
  return pageMetadata({
    key: "/tin-tuc", path: "/tin-tuc",
    title: "Tin tức & thông báo",
    description: "Tin tức, thông báo chính quyền, sự kiện và hoạt động cộng đồng mới nhất tại xã Quỳnh Phụ — cập nhật hằng ngày từ Ban biên tập và người dân địa phương.",
  });
}

export const dynamic = "force-dynamic";

// Số bài tối đa mỗi tab (Trong xã / Ngoài xã) — lọc & phân trang làm ở client.
const SCOPE_LIMIT = 300;

export default async function TinTucPage() {
  // Chỉ hiển thị bài đã xuất bản + đã duyệt (DB) — bài người dùng chờ duyệt không lọt ra đây.
  // Lấy RIÊNG từng phạm vi: nếu gộp chung 1 limit, tin ngoài xã nhập hàng loạt (mới hơn)
  // sẽ chiếm hết suất và đẩy bài trong xã cũ ra khỏi danh sách.
  const [localDocs, outsideDocs, newsConfig, session] = await Promise.all([
    listArticles({ status: "published", scope: "trong-xa", limit: SCOPE_LIMIT }).catch(() => []),
    listArticles({ status: "published", scope: "ngoai-xa", limit: SCOPE_LIMIT }).catch(() => []),
    getNewsPageConfig().catch(() => null),
    getSession().catch(() => null),
  ]);
  const items: Article[] = [...localDocs, ...outsideDocs].map(toNewsCardArticle);
  // Bài người dùng đang chờ duyệt (chỉ của chính họ) — hiển thị ở tab "Chờ duyệt".
  const pendingItems: Article[] = session
    ? (await listMyArticles(session.id).catch(() => []))
        .filter((d) => d.approved === false && d.active !== false)
        .map(toNewsCardArticle)
    : [];
  // Vùng nổi bật & khối "Đọc nhiều" — tính RIÊNG cho từng tab (Trong xã / Ngoài xã) để
  // không lẫn bài giữa hai phạm vi. Theo cấu hình admin (mặc định nếu chưa cấu hình).
  const localItems = items.filter((a) => a.scope !== "ngoai-xa");
  const outsideItems = items.filter((a) => a.scope === "ngoai-xa");
  const local = newsConfig ? resolveNewsBlocks(newsConfig, localItems) : autoNewsBlocks(localItems);
  // Admin chọn thủ công thường là bài trong xã → tab Ngoài xã rỗng thì tự lấy mới nhất / đọc nhiều.
  const outsideCfg = newsConfig ? resolveNewsBlocks(newsConfig, outsideItems) : autoNewsBlocks(outsideItems);
  const outsideAuto = autoNewsBlocks(outsideItems);
  const outside = {
    featured: outsideCfg.featured.length || newsConfig?.featured.enabled === false ? outsideCfg.featured : outsideAuto.featured,
    popular: outsideCfg.popular.length || newsConfig?.popular.enabled === false ? outsideCfg.popular : outsideAuto.popular,
  };
  return (
    <>
      {/* Page hero sáng (gradient + đốm sáng + cây lúa halftone) */}
      <JsonLd data={[jsonLdBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Tin tức", path: "/tin-tuc" }])]} />
      <section className="qp-pagehero" aria-labelledby="news-title">
        <span className="qp-pagehero__blob is-teal" aria-hidden />
        <span className="qp-pagehero__blob is-indigo" aria-hidden />
        <span className="qp-pagehero__blob is-yellow" aria-hidden />
        <span className="qp-pagehero__art" aria-hidden />
        <div className="container-wide qp-pagehero__inner">
          <nav className="qp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span className="qp-breadcrumb__sep">›</span>
            <span className="qp-breadcrumb__current">Tin tức</span>
          </nav>
          <span className="type-tag qp-pagehero__eyebrow">Tin tức · Quỳnh Phụ</span>
          <h1 id="news-title" className="type-h1">Tin tức &amp; thông báo</h1>
          <p className="qp-pagehero__lead">
            Tổng hợp tin tức, thông báo và hoạt động tại xã Quỳnh Phụ — cập nhật thường xuyên.
          </p>
          <span className="qp-pagehero__line" aria-hidden />
        </div>
      </section>

      <section className="qp-newsmain">
        <div className="container-wide">
          <NewsBrowser items={items} blocks={{ "trong-xa": local, "ngoai-xa": outside }} isLoggedIn={!!session} pendingItems={pendingItems} />
        </div>
      </section>
    </>
  );
}
