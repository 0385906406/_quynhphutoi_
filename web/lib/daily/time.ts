// Mốc giờ Việt Nam (UTC+7, không có giờ mùa hè) — server Vercel chạy UTC nên phải tự quy đổi.
const VN_OFFSET_MS = 7 * 3600_000;

// "YYYY-MM-DD" theo lịch Việt Nam.
export function vnDateKey(d: Date = new Date()): string {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function vnMinutesOfDay(d: Date = new Date()): number {
  const v = new Date(d.getTime() + VN_OFFSET_MS);
  return v.getUTCHours() * 60 + v.getUTCMinutes();
}

export function shiftDateKey(key: string, days: number): string {
  const t = Date.parse(`${key}T00:00:00Z`) + days * 86400_000;
  return new Date(t).toISOString().slice(0, 10);
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// "2026-11-24" → "Thứ Ba, 24/11/2026"
export function formatDateKey(key: string, withWeekday = true): string {
  const [y, m, d] = key.split("-");
  const wd = WEEKDAYS[new Date(`${key}T00:00:00Z`).getUTCDay()];
  return withWeekday ? `${wd}, ${d}/${m}/${y}` : `${d}/${m}/${y}`;
}

// ISO → "HH:MM" giờ Việt Nam.
export function vnTime(iso: string): string {
  const v = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${String(v.getUTCHours()).padStart(2, "0")}:${String(v.getUTCMinutes()).padStart(2, "0")}`;
}
