"use client";

import { useId, useState } from "react";

export type DailyPanel = { id: string; label: string; className?: string; node: React.ReactNode };

// Thanh tab cho các khối "hôm nay". mobileOnly: màn rộng hiện tất cả khối dạng lưới (CSS ẩn thanh tab),
// màn hẹp chỉ hiện khối đang chọn — người xem không phải cuộn qua cả 4 khối dài.
export function DailyTabs({ panels, mobileOnly = false, gridClassName = "", label }: {
  panels: DailyPanel[];
  mobileOnly?: boolean;
  gridClassName?: string;
  label: string;
}) {
  const [active, setActive] = useState(panels[0]?.id);
  const uid = useId();
  return (
    <div className={`qp-daily-tabs${mobileOnly ? " is-mobile-only" : ""}`}>
      <div className="qp-tabs qp-daily-tabs__bar" role="tablist" aria-label={label}>
        {panels.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`${uid}-tab-${p.id}`}
            aria-controls={`${uid}-panel-${p.id}`}
            aria-selected={active === p.id}
            className={`qp-tab${active === p.id ? " is-active" : ""}`}
            onClick={() => setActive(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className={gridClassName}>
        {panels.map((p) => (
          <div
            key={p.id}
            id={`${uid}-panel-${p.id}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${p.id}`}
            className={`qp-daily-tabs__panel ${p.className ?? ""}${active === p.id ? " is-active" : ""}`}
          >
            {p.node}
          </div>
        ))}
      </div>
    </div>
  );
}
