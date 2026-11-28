"use client";

// Lưu bài để đọc sau — lưu trên trình duyệt (localStorage), không cần đăng nhập.
const KEY = "qp:bookmarks:v1";
const MAX = 200;
export const BOOKMARK_EVENT = "qp:bookmarks-change";

function load(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function save(list: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); window.dispatchEvent(new Event(BOOKMARK_EVENT)); } catch { /* bỏ qua */ }
}

export const getBookmarks = (): string[] => load();
export const isBookmarked = (slug: string) => load().includes(slug);

/** Bật/tắt; trả về trạng thái mới (true = đã lưu). */
export function toggleBookmark(slug: string): boolean {
  const cur = load();
  if (cur.includes(slug)) { save(cur.filter((s) => s !== slug)); return false; }
  save([slug, ...cur]);
  return true;
}
