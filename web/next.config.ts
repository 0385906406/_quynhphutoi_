import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
