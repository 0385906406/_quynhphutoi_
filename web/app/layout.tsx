import type { Metadata } from "next";
import Script from "next/script";
import { Be_Vietnam_Pro, Space_Grotesk, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/account.css";
import "@/styles/rich-text-editor.css";
import { ToastProvider } from "@/components/common/Toast";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cổng thông tin Quỳnh Phụ",
    template: "%s · Cổng thông tin Quỳnh Phụ",
  },
  description:
    "Cổng thông tin huyện Quỳnh Phụ — tin tức, việc làm, tìm đồ rơi và kết nối cộng đồng.",
};

// Root layout TỐI GIẢN — chỉ <html>/<body>, fonts & CSS toàn cục.
// Chrome (TopBar/Marquee/Footer) nằm ở app/(site)/layout.tsx.
// Trang đăng nhập app/(auth)/ có layout sạch riêng — không chrome.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontVars = `${beVietnam.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`;
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return (
    <html lang="vi" className={fontVars} suppressHydrationWarning>
      <body suppressHydrationWarning><ToastProvider>{children}</ToastProvider></body>
      {/* reCAPTCHA v3 — chỉ tải khi đã cấu hình site key */}
      {recaptchaKey && (
        <Script
          id="recaptcha-v3"
          strategy="afterInteractive"
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`}
        />
      )}
      {/* Loader AdSense — chỉ tải khi đã cấu hình publisher ID (fallback chỗ chưa bán) */}
      {adsenseClient && (
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        />
      )}
    </html>
  );
}
