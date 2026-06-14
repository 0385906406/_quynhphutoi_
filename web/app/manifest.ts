import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#062340",
    lang: "vi",
    icons: [
      { src: "/img/patterns/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/img/patterns/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/img/patterns/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
