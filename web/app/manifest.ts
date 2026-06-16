import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  const icon = s.siteLogo || s.siteFavicon || "/img/patterns/logo.png";
  return {
    name: s.seoSiteName || SITE.name,
    short_name: SITE.shortName,
    description: s.seoSiteDescription || SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#062340",
    lang: "vi",
    icons: [
      { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icon, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
