"use client";

// Modal chèn / sửa link — port từ innovation, bỏ i18n.
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useToast } from "@/components/common/Toast";

export function RteLinkModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const { toast } = useToast();
  type E = { getAttributes(name: string): Record<string, unknown> };
  const attrs = (editor as unknown as E).getAttributes("link");
  const existingHref = (attrs.href as string | undefined) ?? "";
  const existingTarget = (attrs.target as string | undefined) ?? "_blank";

  const [url, setUrl] = useState(existingHref || "https://");
  const [newTab, setNewTab] = useState(existingTarget === "_blank" || !existingHref);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const el = inputRef.current; if (el) { el.focus(); el.select(); } }, []);

  function apply() {
    const trimmed = url.trim();
    if (!trimmed || trimmed === "https://") {
      (editor as unknown as { chain(): { focus(): { unsetLink(): { run(): void } } } }).chain().focus().unsetLink().run();
      onClose(); return;
    }
    if (!/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) { toast.error("Đường dẫn không hợp lệ."); return; }
    (editor as unknown as { chain(): { focus(): { setLink(a: { href: string; target?: string }): { run(): void } } } })
      .chain().focus().setLink({ href: trimmed, ...(newTab ? { target: "_blank" } : {}) }).run();
    onClose();
  }

  function remove() {
    (editor as unknown as { chain(): { focus(): { unsetLink(): { run(): void } } } }).chain().focus().unsetLink().run();
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); apply(); }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="rte-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rte-modal" role="dialog" aria-modal="true">
        <p className="rte-modal__title">Chèn đường dẫn</p>
        <div className="rte-modal__field">
          <label className="rte-modal__label">URL</label>
          <input ref={inputRef} type="url" className="rte-modal__input" value={url} placeholder="https://"
            onChange={(e) => setUrl(e.target.value)} onKeyDown={onKeyDown} />
        </div>
        <label className="rte-modal__checkbox-row">
          <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
          Mở trong tab mới
        </label>
        <div className="rte-modal__actions">
          {existingHref && (
            <button type="button" className="rte-modal__btn rte-modal__btn--danger" onClick={remove}>Xoá link</button>
          )}
          <button type="button" className="rte-modal__btn" onClick={onClose}>Huỷ</button>
          <button type="button" className="rte-modal__btn rte-modal__btn--primary" onClick={apply}>Áp dụng</button>
        </div>
      </div>
    </div>
  );
}
