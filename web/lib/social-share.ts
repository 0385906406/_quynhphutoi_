// Hỗ trợ sharing tích hợp các nền tảng (Facebook, Twitter/X, LinkedIn, Zalo, Email)
// Theo dõi share events để GA4

export type SharePlatform = "facebook" | "twitter" | "linkedin" | "zalo" | "email" | "copy";

export interface ShareOptions {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

// Tạo link share cho từng platform (intent URL)
export function generateShareUrl(platform: SharePlatform, options: ShareOptions): string {
  const { url, title, description = "", image = "" } = options;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  switch (platform) {
    case "facebook":
      // Facebook Sharer (không cần app ID nếu chỉ dùng sharer.php)
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;

    case "twitter":
      // Twitter intent (hỗ trợ via URL param)
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=quynhphutoi`;

    case "linkedin":
      // LinkedIn share
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    case "zalo":
      // Zalo (Vietnam messaging app) — format: zalo://to?title=...&link=...
      return `https://zalo.me/share/?url=${encodedUrl}&title=${encodedTitle}`;

    case "email":
      // mailto link
      return `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`;

    case "copy":
      // Copy to clipboard (xử lý client-side)
      return url;

    default:
      return url;
  }
}

// Track share event to GA4 (client-side)
export function trackShare(platform: SharePlatform, slug: string, title: string) {
  if (typeof window === "undefined") return;

  // Gửi event tới GA4 nếu gtag available
  if ((window as any).gtag) {
    (window as any).gtag("event", "share", {
      event_category: "share",
      event_label: `${platform}_${slug}`,
      method: platform,
      content_title: title,
      content_id: slug,
    });
  }
}

// Mock share count API (thực tế cần fetch từ endpoint hoặc cache DB)
export async function getShareCount(platform: SharePlatform, url: string): Promise<number> {
  // TODO: Implement real share counting via API hoặc DB cache
  // Hiện tại trả random để demo
  return Math.floor(Math.random() * 100);
}
