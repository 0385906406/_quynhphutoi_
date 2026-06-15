"use client";

// Picker chọn bài viết cho cấu hình trang Tin tức.
// Tìm kiếm chạy thẳng lên server (/api/admin/news-page/search) — CHỈ hiện kết quả
// khi đã gõ từ khoá, không đổ toàn bộ danh sách. Mục đã chọn hiện dạng "chip".
import { useEffect, useMemo, useRef, useState } from "react";
import type { NewsCandidate } from "@/lib/news-page";

const DEBOUNCE_MS = 250;

export function ArticlePicker({ selected, max, titles, onChange, onLearnTitles }: {
  selected: string[];
  max: number;
  titles: Record<string, string>;          // slug -> title đã biết (dùng cho chip)
  onChange: (slugs: string[]) => void;
  onLearnTitles: (map: Record<string, string>) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NewsCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dọn timer khi unmount (không gọi setState trong thân effect).
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Tìm kiếm có debounce; rỗng ⇒ xoá kết quả (không hiện gì).
  function onQuery(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    const kw = value.trim();
    if (!kw) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/news-page/search?q=${encodeURIComponent(kw)}`);
        const data = await res.json().catch(() => ({}));
        const items: NewsCandidate[] = Array.isArray(data.items) ? data.items : [];
        setResults(items);
        if (items.length) onLearnTitles(Object.fromEntries(items.map((c) => [c.slug, c.title])));
      } finally { setLoading(false); }
    }, DEBOUNCE_MS);
  }

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const full = selected.length >= max;

  function add(slug: string) {
    if (selectedSet.has(slug)) return;
    onChange(max === 1 ? [slug] : [...selected, slug].slice(0, max));
  }
  function remove(slug: string) {
    onChange(selected.filter((s) => s !== slug));
  }

  return (
    <div className="qp-picker">
      {/* Chip mục đã chọn */}
      {selected.length > 0 ? (
        <div className="qp-picker__chips">
          {selected.map((slug) => (
            <span key={slug} className="qp-picker__chip">
              <span className="qp-picker__chip-text">{titles[slug] ?? slug}</span>
              <button type="button" className="qp-picker__chip-x" aria-label="Bỏ chọn" onClick={() => remove(slug)}>×</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="type-body-small text-muted" style={{ margin: "0 0 8px" }}>Chưa chọn bài nào.</p>
      )}

      {/* Ô tìm kiếm */}
      <input
        className="qp-input"
        placeholder={full ? `Đã đủ ${max} bài — bỏ bớt để chọn khác…` : "Gõ từ khoá để tìm bài…"}
        value={q}
        onChange={(e) => onQuery(e.target.value)}
        disabled={full && max !== 1}
      />

      {/* Kết quả — chỉ hiện khi có từ khoá */}
      {q.trim() && (
        <div className="qp-picker__results">
          {loading ? (
            <p className="type-body-small text-muted" style={{ margin: 4 }}>Đang tìm…</p>
          ) : results.length === 0 ? (
            <p className="type-body-small text-muted" style={{ margin: 4 }}>Không tìm thấy bài khớp.</p>
          ) : (
            results.map((c) => {
              const picked = selectedSet.has(c.slug);
              const disabled = !picked && full && max !== 1;
              return (
                <button
                  key={c.slug}
                  type="button"
                  className={`qp-picker__opt${picked ? " is-picked" : ""}`}
                  onClick={() => (picked ? remove(c.slug) : add(c.slug))}
                  disabled={disabled}
                >
                  <span>{c.title}</span>
                  <span className="qp-picker__opt-state">{picked ? "✓ Đã chọn" : disabled ? "" : "+ Chọn"}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
