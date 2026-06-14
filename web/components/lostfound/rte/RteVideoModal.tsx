"use client";

// Modal chèn video YouTube — port từ innovation, bỏ i18n.
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useToast } from "@/components/common/Toast";

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function RteVideoModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=");
  const [thumbId, setThumbId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleUrlChange(val: string) {
    setUrl(val); setThumbId(extractYouTubeId(val));
  }

  function insert() {
    const trimmed = url.trim();
    if (!/youtube\.com|youtu\.be/i.test(trimmed)) { toast.error("Chỉ hỗ trợ link YouTube."); return; }
    type YtChain = { focus(): { setYoutubeVideo(o: { src: string; width: number; height: number }): { run(): void } } };
    (editor.chain() as unknown as YtChain).focus().setYoutubeVideo({ src: trimmed, width: 640, height: 360 }).run();
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); insert(); }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="rte-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rte-modal" role="dialog" aria-modal="true">
        <p className="rte-modal__title">Chèn video YouTube</p>
        <div className="rte-modal__field">
          <label className="rte-modal__label">URL</label>
          <input ref={inputRef} type="url" className="rte-modal__input" value={url}
            placeholder="https://www.youtube.com/watch?v=..." onChange={(e) => handleUrlChange(e.target.value)} onKeyDown={onKeyDown} />
          <span className="rte-modal__hint">Dán link video YouTube.</span>
        </div>
        <div className="rte-modal__preview">
          {thumbId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://img.youtube.com/vi/${thumbId}/hqdefault.jpg`} alt="YouTube thumbnail" />
          ) : (
            <span className="rte-modal__preview-placeholder">▶ Xem trước</span>
          )}
        </div>
        <div className="rte-modal__actions">
          <button type="button" className="rte-modal__btn" onClick={onClose}>Huỷ</button>
          <button type="button" className="rte-modal__btn rte-modal__btn--primary" onClick={insert}>Chèn</button>
        </div>
      </div>
    </div>
  );
}
