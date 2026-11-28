"use client";

// Hồ sơ sở thích đọc báo — lưu HOÀN TOÀN trong trình duyệt (localStorage), không gửi lịch sử cá nhân lên server.
// Mỗi mục (chuyên mục / thẻ / từ khoá) có điểm + mốc thời gian; điểm tự "nguội" dần (bán rã ~14 ngày)
// để gợi ý luôn bám theo thứ người đọc quan tâm GẦN ĐÂY.

const KEY = "qp:interest:v1";
const HALF_LIFE_MS = 14 * 24 * 3600 * 1000;
const MAX_ENTRIES = 60;   // mỗi nhóm giữ tối đa
const MAX_READ = 300;     // số bài đã đọc nhớ lại
const MAX_SEARCH = 12;

type Entry = { s: number; t: number };
type Profile = {
  off?: boolean;
  cats: Record<string, Entry>;
  tags: Record<string, Entry>;
  words: Record<string, Entry>;
  read: string[];
  searches: string[];
};

export const INTEREST_EVENT = "qp:interest-change";

const empty = (): Profile => ({ cats: {}, tags: {}, words: {}, read: [], searches: [] });

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<Profile>;
    return { off: !!p.off, cats: p.cats ?? {}, tags: p.tags ?? {}, words: p.words ?? {}, read: Array.isArray(p.read) ? p.read : [], searches: Array.isArray(p.searches) ? p.searches : [] };
  } catch { return empty(); }
}

function save(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event(INTEREST_EVENT));
  } catch { /* chế độ riêng tư / hết dung lượng: bỏ qua, web vẫn chạy */ }
}

const decayed = (e: Entry, now: number) => e.s * Math.pow(0.5, (now - e.t) / HALF_LIFE_MS);

function bump(map: Record<string, Entry>, key: string, add: number, now: number) {
  const k = key.normalize("NFC").trim().toLowerCase().slice(0, 40);
  if (!k) return;
  const cur = map[k];
  map[k] = { s: (cur ? decayed(cur, now) : 0) + add, t: now };
  const keys = Object.keys(map);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => decayed(map[a], now) - decayed(map[b], now));
    for (const d of keys.slice(0, keys.length - MAX_ENTRIES)) delete map[d];
  }
}

// Bỏ từ quá ngắn / từ nối tiếng Việt thường gặp để từ khoá có nghĩa hơn.
const STOP = new Set(["và", "của", "là", "có", "cho", "các", "một", "những", "được", "trong", "với", "này", "khi", "để", "đã", "sẽ", "từ", "về", "tại", "ở", "như", "không", "người", "cũng", "nhưng", "ra", "vào", "đến", "theo", "sau", "trước", "hơn", "rất"]);
export function keywords(text: string): string[] {
  return Array.from(new Set(
    text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w)),
  )).slice(0, 12);
}

/** Nhấn mạnh: "open" = mở bài, "deep" = đọc kỹ (cuộn gần hết / ở lại lâu). */
export function recordRead(a: { slug: string; category?: string; tags?: string[]; title?: string }, kind: "open" | "deep") {
  const p = load();
  if (p.off) return;
  const now = Date.now();
  const w = kind === "deep" ? 3 : 1;
  if (a.category) bump(p.cats, a.category, 2 * w, now);
  for (const t of (a.tags ?? []).slice(0, 6)) bump(p.tags, t, 1 * w, now);
  if (kind === "deep" && a.title) for (const k of keywords(a.title).slice(0, 5)) bump(p.words, k, 0.8, now);
  if (!p.read.includes(a.slug)) { p.read.unshift(a.slug); p.read = p.read.slice(0, MAX_READ); }
  save(p);
}

export function recordSearch(q: string) {
  const p = load();
  if (p.off) return;
  const term = q.trim().slice(0, 80);
  if (term.length < 2) return;
  const now = Date.now();
  for (const k of keywords(term)) bump(p.words, k, 2, now);
  p.searches = [term, ...p.searches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, MAX_SEARCH);
  save(p);
}

export type Signals = { cats: [string, number][]; tags: [string, number][]; words: [string, number][]; read: string[] };

const top = (m: Record<string, Entry>, n: number, now: number): [string, number][] =>
  Object.entries(m).map(([k, e]) => [k, Math.round(decayed(e, now) * 100) / 100] as [string, number]).filter(([, s]) => s > 0.15).sort((a, b) => b[1] - a[1]).slice(0, n);

export function getSignals(): Signals | null {
  const p = load();
  if (p.off) return null;
  const now = Date.now();
  return { cats: top(p.cats, 6, now), tags: top(p.tags, 12, now), words: top(p.words, 14, now), read: p.read.slice(0, 80) };
}

export const hasSignals = (s: Signals | null) => !!s && (s.cats.length > 0 || s.tags.length > 0 || s.words.length > 0);
export const recentSearches = (): string[] => load().searches;
export const isInterestOff = (): boolean => load().off === true;

export function setInterestOff(off: boolean) {
  const p = load();
  p.off = off;
  save(p);
}

/** Xoá toàn bộ lịch sử (giữ nguyên lựa chọn bật/tắt). */
export function clearInterest() {
  const p = load();
  save({ ...empty(), off: p.off });
}
