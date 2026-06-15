// Tiện ích nhúng Google Maps từ link người dùng dán — KHÔNG cần API key.
// Link rút gọn (maps.app.goo.gl / goo.gl) không nhúng iframe trực tiếp được vì không
// chứa toạ độ → resolveMapUrl() (server) theo redirect lấy link đầy đủ; mapEmbedSrc()
// trích lat,lng rồi dựng URL nhúng "output=embed". Không lấy được toạ độ → trả null
// (UI fallback về nút "Mở Google Maps").

// Có phải link Google Maps hợp lệ không (chấp nhận cả link rút gọn).
export function isGoogleMapsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const h = u.hostname.toLowerCase();
    if (h === "goo.gl" || h.endsWith(".goo.gl")) return true;          // maps.app.goo.gl, goo.gl/maps
    if (h.includes("google.") && /maps/i.test(u.pathname + u.search)) return true; // google.com/maps?...
    return false;
  } catch {
    return false;
  }
}

// Trích toạ độ từ các dạng URL Maps phổ biến.
export function extractLatLng(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const ok = (a: string, b: string) => {
    const lat = parseFloat(a), lng = parseFloat(b);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
    return null;
  };
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);                       // .../@21.02,105.83,17z
  if (m) return ok(m[1], m[2]);
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);                       // ...!3d21.02!4d105.83
  if (m) return ok(m[1], m[2]);
  m = url.match(/[?&](?:q|query|ll|sll|destination|center)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i);
  if (m) return ok(m[1], m[2]);
  return null;
}

// Dựng URL nhúng iframe (không cần API key). null nếu không nhúng được.
export function mapEmbedSrc(url: string): string | null {
  if (!url) return null;
  if (/\/maps\/embed/i.test(url)) return url;                           // đã là link nhúng sẵn
  const c = extractLatLng(url);
  if (c) return `https://maps.google.com/maps?q=${c.lat},${c.lng}&z=16&hl=vi&output=embed`;
  return null;
}

// (Server) Theo redirect để biến link rút gọn → link đầy đủ có toạ độ. Lỗi/timeout → trả nguyên link.
export async function resolveMapUrl(url: string): Promise<string> {
  const u = url.trim();
  let host = "";
  try { host = new URL(u).hostname.toLowerCase(); } catch { return u; }
  const isShort = host === "goo.gl" || host.endsWith(".goo.gl");
  if (!isShort) return u;
  try {
    const res = await fetch(u, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(4000) });
    const finalUrl = res.url || u;
    // Chỉ chấp nhận nếu host cuối vẫn thuộc Google (chống goo.gl bị lợi dụng redirect lung tung).
    const fh = new URL(finalUrl).hostname.toLowerCase();
    if (fh.includes("google.") || fh === "goo.gl" || fh.endsWith(".goo.gl")) return finalUrl;
    return u;
  } catch {
    return u;
  }
}
