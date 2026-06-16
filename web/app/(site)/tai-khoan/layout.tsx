import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin } from "@/lib/users";
import { cldUrl } from "@/lib/cloudinary-url";
import { AccountNav } from "@/components/account/AccountNav";

export const dynamic = "force-dynamic";

function initials(name: string, email: string) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts.slice(-2).map((w) => w[0]).join("") : base.slice(0, 2)).toUpperCase();
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/tai-khoan");

  return (
    <>
      <section className="qp-pagehero qp-acc-hero" aria-labelledby="acc-title">
        <span className="qp-pagehero__blob is-teal" aria-hidden />
        <span className="qp-pagehero__blob is-indigo" aria-hidden />
        <span className="qp-pagehero__blob is-yellow" aria-hidden />
        <span className="qp-pagehero__art" aria-hidden />
        <div className="container-wide qp-pagehero__inner">
          <nav className="qp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span className="qp-breadcrumb__sep">›</span>
            <span className="qp-breadcrumb__current">Tài khoản</span>
          </nav>
          <div className="qp-acc-hero__id">
            <span className="qp-acc-hero__avatar" aria-hidden>
              {user.avatar
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={cldUrl(user.avatar, { w: 200 })} alt="" />
                : initials(user.name, user.email)}
            </span>
            <div>
              <h1 id="acc-title" className="type-h1" style={{ margin: 0 }}>{user.name || "Tài khoản của tôi"}</h1>
              <p className="qp-acc-hero__email">{user.email}{isAdmin(user) && <span className="qp-acc-hero__role">Quản trị viên</span>}</p>
            </div>
          </div>
          <span className="qp-pagehero__line" aria-hidden />
        </div>
      </section>

      <section className="qp-newsmain">
        <div className="container-wide">
          <div className="qp-acc-layout">
            <aside className="qp-acc-side"><AccountNav /></aside>
            <div className="qp-acc-content">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}
