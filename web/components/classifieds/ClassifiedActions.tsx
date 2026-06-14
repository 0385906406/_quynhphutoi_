"use client";

// Thanh hành động dưới tin mua bán: chia sẻ + (chủ tin) đánh dấu đã bán.
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClassifiedActions({ slug, title, isOwner, status }: { slug: string; title: string; isOwner: boolean; status: "open" | "sold" | "closed" }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const url = () => (typeof window !== "undefined" ? window.location.href : "");

  function shareTo(kind: "fb" | "x" | "zalo") {
    const enc = encodeURIComponent(url()), encT = encodeURIComponent(title);
    const href = kind === "fb" ? `https://www.facebook.com/sharer/sharer.php?u=${enc}`
      : kind === "x" ? `https://twitter.com/intent/tweet?url=${enc}&text=${encT}`
      : `https://zalo.me/share/link?url=${enc}`;
    window.open(href, "_blank", "noopener,noreferrer"); setShareOpen(false);
  }
  async function copyLink() { try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }
  async function nativeShare() { if (typeof navigator !== "undefined" && navigator.share) { try { await navigator.share({ title, url: url() }); } catch {} } else setShareOpen((v) => !v); }

  async function markSold() {
    if (!confirm("Đánh dấu tin này đã bán?")) return;
    setBusy(true);
    try { const res = await fetch(`/api/mua-ban/${slug}/sold`, { method: "POST" }); if (res.ok) router.refresh(); } finally { setBusy(false); }
  }

  return (
    <div className="qp-lf-actions">
      <div className="qp-lf-share">
        <button type="button" className="qp-lf-act" onClick={nativeShare} aria-haspopup="true" aria-expanded={shareOpen}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
          <span>Chia sẻ</span>
        </button>
        {shareOpen && (
          <div className="qp-lf-share__menu">
            <button type="button" onClick={() => shareTo("fb")}>Facebook</button>
            <button type="button" onClick={() => shareTo("x")}>X (Twitter)</button>
            <button type="button" onClick={() => shareTo("zalo")}>Zalo</button>
            <button type="button" onClick={() => { copyLink(); setShareOpen(false); }}>Sao chép liên kết</button>
          </div>
        )}
      </div>
      {isOwner && status === "open" && (
        <button type="button" className="qp-lf-act" onClick={markSold} disabled={busy}>{busy ? "Đang lưu…" : "✓ Đã bán"}</button>
      )}
      {copied && <span className="qp-lf-copied" role="status">✓ Đã sao chép liên kết</span>}
    </div>
  );
}
