"use client";

// Bộ lọc theo ngày (tabs) + thẻ chi tiết cho thời tiết hiện tại / từng ngày dự báo.
import { useMemo, useState } from "react";
import { WeatherIcon } from "./WeatherIcon";
import type { WeatherData, WeatherIconKey } from "@/lib/weather";

const WEEKDAY_FMT = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" });
const DAY_FMT = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" });
const FULL_DATE_FMT = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "2-digit" });

type View = {
  key: string;
  tabLabel: string;
  dateLabel: string;
  icon: WeatherIconKey;
  label: string;
  bigTemp: string;
  meta: { label: string; value: string }[];
};

export function WeatherPanel({ data }: { data: WeatherData }) {
  const views = useMemo<View[]>(() => {
    const { current, daily } = data;
    const out: View[] = [
      {
        key: "current",
        tabLabel: "Hiện tại",
        dateLabel: "Ngay bây giờ",
        icon: current.icon,
        label: current.label,
        bigTemp: `${current.temp}°C`,
        meta: [
          { label: "Cảm giác như", value: `${current.apparentTemp}°C` },
          { label: "Độ ẩm", value: `${current.humidity}%` },
          { label: "Gió", value: `${current.windSpeed} km/h` },
        ],
      },
    ];
    daily.forEach((d, i) => {
      const date = new Date(`${d.date}T00:00:00+07:00`);
      out.push({
        key: d.date,
        tabLabel: i === 0 ? "Hôm nay" : `${WEEKDAY_FMT.format(date)} ${DAY_FMT.format(date)}`,
        dateLabel: i === 0 ? `Hôm nay, ${DAY_FMT.format(date)}` : FULL_DATE_FMT.format(date),
        icon: d.icon,
        label: d.label,
        bigTemp: `${d.tempMax}° / ${d.tempMin}°`,
        meta: [{ label: "Khả năng mưa", value: `${d.precipProb}%` }],
      });
    });
    return out;
  }, [data]);

  const [selected, setSelected] = useState(views[0].key);
  const view = views.find((v) => v.key === selected) ?? views[0];

  return (
    <div className="qp-weather-panel">
      <div className="qp-tabs qp-weather-panel__tabs" role="tablist" aria-label="Chọn ngày xem thời tiết">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={selected === v.key}
            className={`qp-tab${selected === v.key ? " is-active" : ""}`}
            onClick={() => setSelected(v.key)}
          >
            <span className="qp-weather-panel__tab-icon"><WeatherIcon icon={v.icon} size={18} /></span>
            {v.tabLabel}
          </button>
        ))}
      </div>

      <div className="qp-stat-card qp-weather-current">
        <div className="qp-weather-current__top">
          <span className="qp-weather-current__loc">{data.locationName} · {view.dateLabel}</span>
          <span className="qp-weather-current__icon"><WeatherIcon icon={view.icon} size={56} /></span>
        </div>
        <div className="num qp-weather-current__temp">{view.bigTemp}</div>
        <div className="label qp-weather-current__label">{view.label}</div>
        <div className="qp-weather-current__meta">
          {view.meta.map((m) => (
            <span key={m.label}>{m.label} {m.value}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
