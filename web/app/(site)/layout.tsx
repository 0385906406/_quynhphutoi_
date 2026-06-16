// Layout cho khối trang cổng thông tin — kèm chrome đầy đủ.
// Mọi trang công khai (/, /tin-tuc, /lien-he…) nằm trong nhóm (site) này.
import { TopBar } from "@/components/layout/TopBar";
import { Marquee } from "@/components/layout/Marquee";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { StickyAdBar } from "@/components/ads/StickyAdBar";
import { getSession } from "@/lib/auth";
import { isCurrentUserStaff } from "@/lib/admin";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // "staff" = admin hoặc biên tập viên → hiện lối tắt vào khu /admin trên menu tài khoản.
  const [user, staff, settings] = await Promise.all([getSession(), isCurrentUserStaff(), getSettings()]);
  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua tới nội dung
      </a>
      <TopBar user={user} isAdmin={staff} logo={settings.siteLogo || undefined} />
      <Marquee />
      <main id="main">{children}</main>
      <Footer />
      <BackToTop />
      <StickyAdBar />
    </>
  );
}
