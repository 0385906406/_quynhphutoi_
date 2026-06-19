"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import type { GalleryImage } from "./RteGalleryNode";

export function RteGalleryView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const images: GalleryImage[] = node.attrs.images ?? [];
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  function addImage() {
    const url = newUrl.trim();
    if (!url) return;
    updateAttributes({ images: [...images, { src: url, alt: "" }] });
    setNewUrl("");
  }

  function removeImage(idx: number) {
    updateAttributes({ images: images.filter((_, i) => i !== idx) });
  }

  const editable = editor.isEditable;

  return (
    <NodeViewWrapper>
      <figure
        className={`rte-gallery rte-gallery--editing${selected ? " is-selected" : ""}`}
        contentEditable={false}
      >
        {images.length > 0 && (
          <div className="rte-gallery__grid">
            {images.map((img, idx) => (
              <div key={idx} className="rte-gallery__item">
                <img src={img.src} alt={img.alt} className="rte-gallery__img" loading="lazy" />
                {editable && (
                  <button
                    type="button"
                    className="rte-gallery__remove"
                    onClick={() => removeImage(idx)}
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {editable && (
          <div className="rte-gallery__toolbar">
            {adding ? (
              <div className="rte-gallery__add-form">
                <input
                  type="url"
                  autoFocus
                  placeholder="https://…/anh.jpg"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addImage(); }
                    if (e.key === "Escape") { setAdding(false); setNewUrl(""); }
                  }}
                  className="rte-gallery__url-input"
                />
                <button
                  type="button"
                  className="rte-gallery__add-confirm"
                  onClick={addImage}
                  disabled={!newUrl.trim()}
                >
                  Thêm
                </button>
                <button
                  type="button"
                  className="rte-gallery__add-cancel"
                  onClick={() => { setAdding(false); setNewUrl(""); }}
                >
                  Huỷ
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="rte-gallery__add-btn"
                onClick={() => setAdding(true)}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {images.length === 0 ? "Thêm ảnh vào bộ ảnh" : "Thêm ảnh"}
              </button>
            )}
            {images.length > 0 && (
              <span className="rte-gallery__count">{images.length} ảnh</span>
            )}
          </div>
        )}
      </figure>
    </NodeViewWrapper>
  );
}
