// Layout cho khối trang cổng thông tin — kèm chrome đầy đủ.
// Mọi trang công khai (/, /tin-tuc, /lien-he…) nằm trong nhóm (site) này.
import { TopBar } from "@/components/layout/TopBar";
import { Marquee } from "@/components/layout/Marquee";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { StickyAdBar } from "@/components/ads/StickyAdBar";
import { getSession } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/admin";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, admin] = await Promise.all([getSession(), isCurrentUserAdmin()]);
  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua tới nội dung
      </a>
      <TopBar user={user} isAdmin={admin} />
      <Marquee />
      <main id="main">{children}</main>
      <Footer />
      <BackToTop />
      <StickyAdBar />
    </>
  );
}
