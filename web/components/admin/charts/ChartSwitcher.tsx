"use client";

// Thẻ biểu đồ có dropdown chọn loại số liệu — gọn thay vì bày hết nhiều thẻ.
import { useState } from "react";
import { BarList, type BarItem } from "./BarList";
import { Donut, type DonutItem } from "./Donut";

export type SwitchOption =
  | { key: string; label: string; type: "bar"; items: BarItem[]; unit?: string }
  | { key: string; label: string; type: "donut"; items: DonutItem[]; center?: string };

export function ChartSwitcher({ title, options, className }: { title: string; options: SwitchOption[]; className?: string }) {
  const [key, setKey] = useState(options[0]?.key ?? "");
  const cur = options.find((o) => o.key === key) ?? options[0];

  return (
    <div className={`qp-chart-card${className ? ` ${className}` : ""}`}>
      <div className="qp-chart-card__head">
        <span className="qp-chart-card__title">{title}</span>
        {options.length > 1 && (
          <select className="qp-select" style={{ width: "auto", maxWidth: 230 }} value={key} onChange={(e) => setKey(e.target.value)} aria-label="Chọn số liệu">
            {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        )}
      </div>
      {cur?.type === "bar"
        ? <BarList items={cur.items} unit={cur.unit} />
        : cur?.type === "donut"
          ? <Donut items={cur.items} centerLabel={cur.center} />
          : null}
    </div>
  );
}
