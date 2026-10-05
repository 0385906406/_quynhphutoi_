"use client";

// Bộ lọc theo ngày (tabs) + thẻ chi tiết cho thời tiết hiện tại / từng ngày dự báo.
import { useMemo, useState } from "react";
import { WeatherIcon } from "./WeatherIcon";
import type { WeatherData, WeatherIconKey } from "@/lib/weather";

// Tên thứ CỐ ĐỊNH thay vì Intl "vi-VN": dữ liệu ICU của Node (server) và từng trình duyệt
// viết khác nhau ("Th 3" / "Thứ 3") → lệch hydration. Định dạng giữ y như bản Intl của server.
const WEEKDAY_SHORT = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
const WEEKDAY_LONG = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// d.date dạng "YYYY-MM-DD" (ngày theo giờ VN) → tách trực tiếp, không phụ thuộc múi giờ máy.
function dateParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return { short: WEEKDAY_SHORT[wd], long: WEEKDAY_LONG[wd], dash: `${dd}-${mm}`, slash: `${dd}/${mm}` };
}

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
      const p = dateParts(d.date);
      out.push({
        key: d.date,
        tabLabel: i === 0 ? "Hôm nay" : `${p.short} ${p.dash}`,
        dateLabel: i === 0 ? `Hôm nay, ${p.dash}` : `${p.long}, ${p.slash}`,
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
