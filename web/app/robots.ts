import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Khu riêng tư / không cần index.
        disallow: [
          "/admin",
          "/api/",
          "/tai-khoan",
          "/thong-bao",
          "/tim-kiem",
          "/dang-nhap",
          "/dang-ky",
          "/quen-mat-khau",
          "/dat-lai-mat-khau",
          "/quang-cao",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
