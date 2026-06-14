"use client";

// Thanh tương tác dưới tin: thích (like) · bình luận (cuộn xuống) · chia sẻ.
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  title: string;
  initialLiked: boolean;
  initialLikeCount: number;
  commentCount: number;
  isLoggedIn: boolean;
  apiBase?: string;        // mặc định tin tìm đồ rơi; truyền "/api/tin-tuc" cho bài viết
};

export function PostInteractions({ slug, title, initialLiked, initialLikeCount, commentCount, isLoggedIn, apiBase = "/api/lost-found" }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const pageUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  async function toggleLike() {
    if (!isLoggedIn) { router.push("/dang-nhap"); return; }
    if (busy) return;
    setBusy(true);
    // Optimistic
    setLiked((v) => !v); setCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`${apiBase}/${slug}/like`, { method: "POST" });
      if (res.ok) { const d = await res.json(); setLiked(d.liked); setCount(d.count); }
      else { setLiked(liked); setCount(count); } // revert
    } catch { setLiked(liked); setCount(count); } finally { setBusy(false); }
  }

  function scrollToComments() {
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(pageUrl()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) { try { await navigator.share({ title, url: pageUrl() }); } catch {} }
    else setShareOpen((v) => !v);
  }

  function shareTo(kind: "fb" | "x" | "zalo") {
    const enc = encodeURIComponent(pageUrl());
    const encT = encodeURIComponent(title);
    const href =
      kind === "fb" ? `https://www.facebook.com/sharer/sharer.php?u=${enc}`
      : kind === "x" ? `https://twitter.com/intent/tweet?url=${enc}&text=${encT}`
      : `https://zalo.me/share/link?url=${enc}`;
    window.open(href, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

  return (
    <div className="qp-lf-actions">
      <button type="button" className={`qp-lf-act${liked ? " is-liked" : ""}`} onClick={toggleLike} aria-pressed={liked} disabled={busy}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>
        </svg>
        <span>{count > 0 ? count : ""} Thích</span>
      </button>

      <button type="button" className="qp-lf-act" onClick={scrollToComments}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-4-1L3 20l1-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 11.5 2 8.4 8.4 0 0 1 21 11.5z"/>
        </svg>
        <span>{commentCount > 0 ? commentCount : ""} Bình luận</span>
      </button>

      <div className="qp-lf-share">
        <button type="button" className="qp-lf-act" onClick={nativeShare} aria-haspopup="true" aria-expanded={shareOpen}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>
          </svg>
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

      {copied && <span className="qp-lf-copied" role="status">✓ Đã sao chép liên kết</span>}
    </div>
  );
}
