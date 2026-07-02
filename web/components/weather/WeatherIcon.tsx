import type { WeatherIconKey } from "@/lib/weather";

// Mây dùng chung — toạ độ đã kiểm tra kỹ để không bị cắt đỉnh trong viewBox 24x24
// (đỉnh mây nằm ở y≈4, đủ chừa lề trên cho strokeWidth=2).
const CLOUD_PATH = "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z";

export function WeatherIcon({ icon, size = 24 }: { icon: WeatherIconKey; size?: number }) {
  const p = {
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: size, height: size,
  };
  switch (icon) {
    case "sunny":
      return (
        <svg {...p} className="qp-wicon" aria-hidden>
          <g className="qp-wicon-rays"><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>
          <circle className="qp-wicon-sun" cx="12" cy="12" r="4" />
        </svg>
      );
    case "partly-cloudy":
      return (
        <svg {...p} className="qp-wicon" aria-hidden>
          <g className="qp-wicon-rays"><path d="M4.5 6.5 5.6 7.6M8 4v1.5M2 9h1.5" /></g>
          <circle className="qp-wicon-sun" cx="8" cy="9" r="3" />
          <path className="qp-wicon-cloud" d="M8 17h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6-1.5A4.5 4.5 0 0 0 8 17z" />
        </svg>
      );
    case "cloudy":
      return (<svg {...p} className="qp-wicon" aria-hidden><path className="qp-wicon-cloud" d={CLOUD_PATH} /></svg>);
    case "fog":
      return (
        <svg {...p} className="qp-wicon" aria-hidden>
          <g className="qp-wicon-fog qp-wicon-fog--1"><path d="M4 8h13" /></g>
          <g className="qp-wicon-fog qp-wicon-fog--2"><path d="M3 13h16" /></g>
          <g className="qp-wicon-fog qp-wicon-fog--3"><path d="M4 18h13" /></g>
        </svg>
      );
    case "rain":
      return (
        <svg {...p} className="qp-wicon" aria-hidden>
          <path className="qp-wicon-cloud" d={CLOUD_PATH} />
          <g className="qp-wicon-drop qp-wicon-drop--1"><path d="M8 20v3" /></g>
          <g className="qp-wicon-drop qp-wicon-drop--2"><path d="M12 20v3" /></g>
          <g className="qp-wicon-drop qp-wicon-drop--3"><path d="M16 20v3" /></g>
        </svg>
      );
    case "thunderstorm":
      return (
        <svg {...p} className="qp-wicon" aria-hidden>
          <path className="qp-wicon-cloud" d={CLOUD_PATH} />
          <path className="qp-wicon-bolt" d="M12.5 16l-2 3h2l-2 3" />
        </svg>
      );
    case "snow":
      return (
        <svg {...p} className="qp-wicon" aria-hidden>
          <path className="qp-wicon-cloud" d={CLOUD_PATH} />
          <g className="qp-wicon-flake qp-wicon-flake--1"><path d="M8 21h.01" /></g>
          <g className="qp-wicon-flake qp-wicon-flake--2"><path d="M12 21h.01" /></g>
          <g className="qp-wicon-flake qp-wicon-flake--3"><path d="M16 21h.01" /></g>
        </svg>
      );
    default:
      return null;
  }
}
