"use client";

// Giao diện chấm điểm SEO trong trình soạn admin:
//  • <SerpPreview>: xem trước kết quả Google (máy tính / điện thoại) — dùng chung cho mọi module.
//  • <SeoAnalysisPanel>: vòng điểm + danh sách việc cần làm từ lib/seo-analysis.ts.
import { useState } from "react";
import { SITE } from "@/lib/seo";
import { scoreColor, type SeoAnalysis, type SeoCheck } from "@/lib/seo-analysis";

// Google cắt tiêu đề theo bề ngang (~600px) — quy đổi xấp xỉ theo ký tự.
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + " …" : s);

export function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const host = SITE.url.replace(/^https?:\/\//, "");
  const crumbs = [host, ...path.split("/").filter(Boolean)].join(" › ");
  const fullTitle = title ? `${title} · ${SITE.name}` : "";
  const tMax = device === "mobile" ? 70 : 62;
  const dMax = device === "mobile" ? 120 : 158;
  return (
    <div className="qp-serp">
      <div className="qp-serp__head">
        <span className="qp-serp__label">Xem trước trên Google</span>
        <div className="qp-serp__switch" role="group" aria-label="Thiết bị xem trước">
          <button type="button" className={device === "mobile" ? "is-active" : ""} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Điện thoại</button>
          <button type="button" className={device === "desktop" ? "is-active" : ""} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Máy tính</button>
        </div>
      </div>
      <div className={`qp-serp__card is-${device}`}>
        <div className="qp-serp__site">
          <span className="qp-serp__favicon" aria-hidden>QP</span>
          <span className="qp-serp__sitetext">
            <span className="qp-serp__sitename">{SITE.name}</span>
            <span className="qp-serp__url">{cut(crumbs, device === "mobile" ? 44 : 70)}</span>
          </span>
        </div>
        <div className="qp-serp__title">{fullTitle ? cut(fullTitle, tMax) : <i>Chưa có tiêu đề</i>}</div>
        <div className="qp-serp__desc">{description ? cut(description, dMax) : <i>Chưa có mô tả — Google sẽ tự lấy một đoạn trong bài.</i>}</div>
      </div>
    </div>
  );
}

// Thanh đo độ dài ký tự (xanh trong khoảng đẹp, vàng gần, đỏ ngoài)
export function LengthMeter({ value, min, max, hardMax }: { value: number; min: number; max: number; hardMax: number }) {
  const status = value >= min && value <= max ? "good" : value === 0 || value > hardMax ? "bad" : "ok";
  return (
    <span className={`qp-lenmeter is-${status}`} aria-label={`${value} ký tự, nên ${min}–${max}`}>
      <span className="qp-lenmeter__bar"><span style={{ width: `${Math.min(100, (value / hardMax) * 100)}%` }} /></span>
      <span className="qp-lenmeter__num">{value}/{max}</span>
    </span>
  );
}

function Ring({ value, label }: { value: number; label: string }) {
  const c = 2 * Math.PI * 22;
  return (
    <div className={`qp-seoring is-${scoreColor(value)}`}>
      <svg viewBox="0 0 52 52" width="56" height="56" aria-hidden>
        <circle cx="26" cy="26" r="22" className="qp-seoring__track" />
        <circle cx="26" cy="26" r="22" className="qp-seoring__val" strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} transform="rotate(-90 26 26)" />
      </svg>
      <span className="qp-seoring__num">{value}</span>
      <span className="qp-seoring__label">{label}</span>
    </div>
  );
}

function CheckList({ title, items, tone }: { title: string; items: SeoCheck[]; tone: "bad" | "ok" | "good" }) {
  if (!items.length) return null;
  return (
    <div className={`qp-seochecks is-${tone}`}>
      <div className="qp-seochecks__title">{title} <span>({items.length})</span></div>
      <ul>
        {items.map((c) => (
          <li key={c.id}>
            <span className="qp-seochecks__dot" aria-hidden />
            <span><b>{c.label}:</b> {c.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SeoAnalysisPanel({ analysis }: { analysis: SeoAnalysis }) {
  const [group, setGroup] = useState<"seo" | "readability">("seo");
  const list = analysis.checks.filter((c) => c.group === group);
  const bad = list.filter((c) => c.status === "bad");
  const ok = list.filter((c) => c.status === "ok");
  const good = list.filter((c) => c.status === "good");
  return (
    <div className="qp-seopanel">
      <div className="qp-seopanel__rings">
        <Ring value={analysis.total} label="Tổng" />
        <Ring value={analysis.seoScore} label="SEO" />
        <Ring value={analysis.readabilityScore} label="Dễ đọc" />
        <div className="qp-seopanel__stats">
          <span><b>{analysis.stats.words}</b> âm tiết</span>
          <span><b>{analysis.stats.headings}</b> tiêu đề phụ</span>
          <span><b>{analysis.stats.internalLinks}</b> link nội bộ</span>
          <span><b>{analysis.stats.images}</b> ảnh trong bài</span>
        </div>
      </div>

      <div className="qp-seopanel__tabs" role="tablist" aria-label="Nhóm tiêu chí">
        <button type="button" role="tab" aria-selected={group === "seo"} className={group === "seo" ? "is-active" : ""} onClick={() => setGroup("seo")}>
          Tối ưu SEO <span className={`qp-seo-badge qp-seo-badge--${scoreColor(analysis.seoScore)}`}>{analysis.seoScore}</span>
        </button>
        <button type="button" role="tab" aria-selected={group === "readability"} className={group === "readability" ? "is-active" : ""} onClick={() => setGroup("readability")}>
          Dễ đọc <span className={`qp-seo-badge qp-seo-badge--${scoreColor(analysis.readabilityScore)}`}>{analysis.readabilityScore}</span>
        </button>
      </div>

      <CheckList title="Cần sửa" items={bad} tone="bad" />
      <CheckList title="Nên cải thiện" items={ok} tone="ok" />
      {good.length > 0 && (
        <details className="qp-seochecks is-good">
          <summary className="qp-seochecks__title">Đã tốt <span>({good.length})</span></summary>
          <ul>
            {good.map((c) => (
              <li key={c.id}><span className="qp-seochecks__dot" aria-hidden /><span><b>{c.label}:</b> {c.message}</span></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
