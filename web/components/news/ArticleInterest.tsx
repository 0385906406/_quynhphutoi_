"use client";

// Gắn vào trang bài viết: ghi nhớ sở thích (mở bài = điểm nhẹ; cuộn >70% hoặc ở lại ≥25s = "đọc kỹ", điểm cao).
import { useEffect } from "react";
import { recordRead } from "@/lib/interest";

export function ArticleInterest({ slug, category, tags, title }: { slug: string; category: string; tags: string[]; title: string }) {
  const tagKey = tags.join("|");
  useEffect(() => {
    const meta = { slug, category, tags: tagKey ? tagKey.split("|") : [], title };
    recordRead(meta, "open");
    let deep = false;
    const mark = () => { if (!deep) { deep = true; recordRead(meta, "deep"); cleanup(); } };
    const onScroll = () => {
      const el = document.getElementById("article-body");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const read = (window.innerHeight - r.top) / Math.max(1, r.height);
      if (read > 0.7) mark();
    };
    const timer = window.setTimeout(() => { if (document.visibilityState === "visible") mark(); }, 25000);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); }
    return cleanup;
  }, [slug, category, tagKey, title]);
  return null;
}
