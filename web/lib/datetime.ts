// Tiện ích ngày/giờ DÙNG CHUNG — luôn quy về múi giờ Việt Nam để server (production
// thường chạy UTC) và client (UTC+7) render RA CÙNG một chuỗi → không sai ngày, không
// hydration mismatch. File thuần (không "use client") nên dùng được cả server lẫn client.

const VN_TZ = "Asia/Ho_Chi_Minh";

const DATE_FMT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TZ, day: "2-digit", month: "2-digit", year: "numeric",
});
const DATETIME_FMT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Ngày tuyệt đối "dd/mm/yyyy" theo giờ VN. An toàn gọi khi render (SSR + client khớp nhau).
export function formatDate(value: string | number | Date | null | undefined, fallback = "—"): string {
  const d = toDate(value);
  return d ? DATE_FMT.format(d) : fallback;
}

// Ngày + giờ "dd/mm/yyyy hh:mm" theo giờ VN.
export function formatDateTime(value: string | number | Date | null | undefined, fallback = "—"): string {
  const d = toDate(value);
  return d ? DATETIME_FMT.format(d) : fallback;
}

// Khoảng thời gian tương đối ("vừa xong" / "5 phút trước" …). Cần truyền mốc `now`
// (ms) để kết quả XÁC ĐỊNH — tránh phụ thuộc Date.now() ẩn khi gọi lúc render.
// Quá 30 ngày thì trả ngày tuyệt đối. Dùng qua <TimeAgo> để không lệch hydration.
export function relativeTime(value: string | number | Date | null | undefined, now: number, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  const s = Math.floor((now - d.getTime()) / 1000);
  if (s < 0) return "vừa xong";
  if (s < 60) return "vừa xong";
  const m = Math.floor(s / 60); if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} giờ trước`;
  const dd = Math.floor(h / 24); if (dd < 30) return `${dd} ngày trước`;
  return formatDate(d, fallback);
}
