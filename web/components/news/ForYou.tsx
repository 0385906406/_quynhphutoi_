"use client";

// Khối "Dành cho bạn": gợi ý bài theo sở thích đọc (lưu trong trình duyệt). Người mới → bài đang được quan tâm.
// Người dùng luôn kiểm soát được: Tắt gợi ý / Xoá lịch sử.
import { useCallback, useEffect, useState } from "react";
import { NewsCard } from "./NewsCard";
import { clearInterest, getSignals, hasSignals, INTEREST_EVENT, isInterestOff, setInterestOff } from "@/lib/interest";
import type { Rec } from "@/lib/recommend";

type Props = {
  title?: string;
  eyebrow?: string;
  limit?: number;
  exclude?: string[];
  scope?: "trong-xa" | "ngoai-xa";
  className?: string;
};

export function ForYou({ title = "Dành cho bạn", eyebrow = "Gợi ý", limit = 4, exclude = [], scope, className = "" }: Props) {
  const [items, setItems] = useState<Rec[] | null>(null);
  const [personal, setPersonal] = useState(false);
  const [off, setOff] = useState(false);
  const [msg, setMsg] = useState("");
  const exKey = exclude.join(",");

  const load = useCallback(async (signal?: AbortSignal) => {
    if (isInterestOff()) { setOff(true); setItems([]); return; }
    setOff(false);
    const sig = getSignals();
    try {
      const res = await fetch("/api/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal,
        body: JSON.stringify({ signals: hasSignals(sig) ? sig : { cats: [], tags: [], words: [], read: sig?.read ?? [] }, exclude: exKey ? exKey.split(",") : [], limit, scope }),
      });
      const data = (await res.json()) as { items: Rec[]; personalized: boolean };
      setItems(data.items ?? []); setPersonal(!!data.personalized);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setItems([]);
    }
  }, [exKey, limit, scope]);

  useEffect(() => {
    const ac = new AbortController();
    // load() chỉ setState sau khi fetch xong (bất đồng bộ), không phải đồng bộ trong effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  // Đổi lựa chọn ở nơi khác (tab khác / khối khác) → cập nhật theo.
  useEffect(() => {
    const h = () => void load();
    window.addEventListener(INTEREST_EVENT, h);
    return () => window.removeEventListener(INTEREST_EVENT, h);
  }, [load]);

  if (items === null) {
    return (
      <section className={`qp-foryou ${className}`} aria-busy="true" aria-label={title}>
        <div className="qp-foryou__skel" aria-hidden>{Array.from({ length: Math.min(limit, 4) }).map((_, i) => <span key={i} className="qp-skel qp-skel--card" />)}</div>
      </section>
    );
  }
  if (off) {
    return (
      <section className={`qp-foryou qp-foryou--off ${className}`} aria-label={title}>
        <p className="type-body-small">Gợi ý theo sở thích đang <b>tắt</b>. <button type="button" className="qp-foryou__link" onClick={() => { setInterestOff(false); setMsg(""); }}>Bật lại</button></p>
      </section>
    );
  }
  if (items.length === 0) return null;

  return (
    <section className={`qp-foryou ${className}`} aria-label={title}>
      <header className="qp-newsgrid-head qp-foryou__head">
        <div>
          <span className="type-tag qp-sechead__eyebrow">{eyebrow}</span>
          <h2 className="type-h2">{personal ? title : "Đang được quan tâm"}</h2>
          <p className="type-body-small qp-foryou__sub">
            {personal ? "Chọn theo những bài bạn đã đọc và từ khoá bạn đã tìm. Thông tin này chỉ lưu trên máy của bạn." : "Đọc thêm vài bài, mục này sẽ tự gợi ý đúng thứ bạn thích."}
          </p>
        </div>
        <div className="qp-foryou__ctl">
          {personal && <button type="button" className="qp-foryou__link" onClick={() => { clearInterest(); setMsg("Đã xoá lịch sử gợi ý."); }}>Xoá lịch sử</button>}
          <button type="button" className="qp-foryou__link" onClick={() => setInterestOff(true)}>Tắt gợi ý</button>
        </div>
      </header>
      {msg && <p className="type-body-small qp-foryou__msg" role="status">{msg}</p>}
      <div className="qp-grid-news qp-scroller">
        {items.map((r) => (
          <div key={r.id} className="qp-foryou__item">
            <span className="qp-foryou__why">{r.reason}</span>
            <NewsCard a={r} />
          </div>
        ))}
      </div>
    </section>
  );
}
