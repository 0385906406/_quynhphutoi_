import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ảnh/icon tĩnh trong /public: cho trình duyệt & CDN giữ 7 ngày (rồi tự kiểm tra lại ngầm) → vào lại trang nhanh hơn.
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    // Header bảo mật an toàn (không chặn nội dung): chống nhúng khung, đoán kiểu file, lộ URL nguồn, ép HTTPS.
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];
    return [{ source: "/:path*", headers: security }, { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, max-age=0" }, { key: "Service-Worker-Allowed", value: "/" }] }, { source: "/img/:path*", headers: cache }, { source: "/:file(favicon.ico|manifest.webmanifest|icon.svg)", headers: cache }];
  },
  images: {
    // Loader tuỳ biến: ảnh Cloudinary lấy thẳng CDN kèm f_auto,q_auto,w (xem lib/cloudinary-loader.ts);
    // ảnh khác trả nguyên. Bỏ được hop qua bộ tối ưu /_next/image của Vercel.
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
    // Ảnh minh hoạ tin tức lấy từ loremflickr (ảnh Flickr thật theo từ khoá).
    remotePatterns: [
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "*.staticflickr.com" },
      // Ảnh upload lưu trên Cloudinary.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
