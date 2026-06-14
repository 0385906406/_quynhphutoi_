"use client";

// Combobox kiểu "Select2": nút mở dropdown, có ô tìm kiếm bên trong, lọc theo gõ,
// click hoặc Enter để chọn. Mỗi option có thể kèm hint (vd "Xã mới: …").
import { useEffect, useMemo, useRef, useState } from "react";

export type ComboOption = { value: string; label: string; hint?: string };

export function Combobox({
  options, value, onChange, placeholder = "— Chọn —", searchPlaceholder = "Gõ để tìm…", id,
}: {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q));
  }, [options, query]);

  // Đóng khi click ra ngoài.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  // Mở thì focus ô tìm (không đụng state trong effect).
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  function toggle() {
    if (!open) { setQuery(""); setActive(0); }
    setOpen((v) => !v);
  }
  function pick(o: ComboOption) { onChange(o.value); setOpen(false); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) pick(filtered[active]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  }

  return (
    <div className="qp-combo" ref={ref}>
      <button type="button" id={id} className="qp-combo__control" aria-haspopup="listbox" aria-expanded={open}
        onClick={toggle}>
        <span className={selected ? "qp-combo__value" : "qp-combo__ph"}>{selected ? selected.label : placeholder}</span>
        <svg className="qp-combo__chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="qp-combo__pop">
          <div className="qp-combo__search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input ref={searchRef} type="text" value={query} placeholder={searchPlaceholder}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKeyDown} />
          </div>
          <ul className="qp-combo__list" role="listbox">
            {filtered.length === 0 ? (
              <li className="qp-combo__empty">Không có kết quả</li>
            ) : (
              filtered.map((o, i) => (
                <li key={o.value} role="option" aria-selected={o.value === value}
                  className={`qp-combo__opt${i === active ? " is-active" : ""}${o.value === value ? " is-selected" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); pick(o); }}>
                  <span className="qp-combo__opt-label">{o.label}</span>
                  {o.hint && <span className="qp-combo__opt-hint">{o.hint}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
