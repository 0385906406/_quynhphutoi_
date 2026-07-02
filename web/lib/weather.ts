// Thời tiết — nguồn Open-Meteo (api.open-meteo.com), miễn phí, KHÔNG cần khoá API.
// Toạ độ/số ngày dự báo lấy từ admin Settings (lib/settings.ts). Cache 30 phút qua Next fetch revalidate.
import type { AppSettings } from "@/lib/settings";

export type WeatherIconKey = "sunny" | "partly-cloudy" | "cloudy" | "fog" | "rain" | "thunderstorm" | "snow";

export type WeatherCurrent = {
  temp: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  label: string;
  icon: WeatherIconKey;
};

export type WeatherDay = {
  date: string;       // ISO yyyy-mm-dd
  tempMax: number;
  tempMin: number;
  precipProb: number;
  label: string;
  icon: WeatherIconKey;
};

export type WeatherData = {
  locationName: string;
  current: WeatherCurrent;
  daily: WeatherDay[];
  updatedAt: string;
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FETCH_TIMEOUT_MS = 8000;
const REVALIDATE_SECONDS = 1800; // 30 phút

// Mã thời tiết WMO (weather_code) → nhãn tiếng Việt + icon.
const WMO_CODE_MAP: Record<number, { label: string; icon: WeatherIconKey }> = {
  0: { label: "Trời quang", icon: "sunny" },
  1: { label: "Ít mây", icon: "partly-cloudy" },
  2: { label: "Mây rải rác", icon: "partly-cloudy" },
  3: { label: "Nhiều mây", icon: "cloudy" },
  45: { label: "Sương mù", icon: "fog" },
  48: { label: "Sương mù đóng băng", icon: "fog" },
  51: { label: "Mưa phùn nhẹ", icon: "rain" },
  53: { label: "Mưa phùn", icon: "rain" },
  55: { label: "Mưa phùn dày", icon: "rain" },
  56: { label: "Mưa phùn đóng băng nhẹ", icon: "rain" },
  57: { label: "Mưa phùn đóng băng", icon: "rain" },
  61: { label: "Mưa nhỏ", icon: "rain" },
  63: { label: "Mưa vừa", icon: "rain" },
  65: { label: "Mưa to", icon: "rain" },
  66: { label: "Mưa đóng băng nhẹ", icon: "rain" },
  67: { label: "Mưa đóng băng", icon: "rain" },
  71: { label: "Tuyết rơi nhẹ", icon: "snow" },
  73: { label: "Tuyết rơi vừa", icon: "snow" },
  75: { label: "Tuyết rơi dày", icon: "snow" },
  77: { label: "Hạt tuyết", icon: "snow" },
  80: { label: "Mưa rào nhẹ", icon: "rain" },
  81: { label: "Mưa rào", icon: "rain" },
  82: { label: "Mưa rào lớn", icon: "rain" },
  85: { label: "Mưa tuyết rào nhẹ", icon: "snow" },
  86: { label: "Mưa tuyết rào lớn", icon: "snow" },
  95: { label: "Dông", icon: "thunderstorm" },
  96: { label: "Dông kèm mưa đá nhẹ", icon: "thunderstorm" },
  99: { label: "Dông kèm mưa đá lớn", icon: "thunderstorm" },
};

function describeCode(code: number): { label: string; icon: WeatherIconKey } {
  return WMO_CODE_MAP[code] ?? { label: "Không xác định", icon: "cloudy" };
}

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

// Gọi Open-Meteo theo toạ độ + số ngày dự báo. Ném lỗi (tiếng Việt) khi thất bại.
export async function fetchWeather(lat: number, lon: number, days: number): Promise<Omit<WeatherData, "locationName">> {
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=Asia%2FBangkok&forecast_days=${days}`;

  let data: OpenMeteoResponse;
  try {
    data = (await fetchJson(url)) as OpenMeteoResponse;
  } catch {
    throw new Error("Không lấy được dữ liệu thời tiết lúc này. Vui lòng thử lại sau.");
  }

  const c = data.current;
  const d = data.daily;
  if (!c || !d?.time) throw new Error("Dữ liệu thời tiết trả về không hợp lệ.");

  const currentInfo = describeCode(c.weather_code ?? -1);
  const current: WeatherCurrent = {
    temp: Math.round(c.temperature_2m ?? 0),
    apparentTemp: Math.round(c.apparent_temperature ?? 0),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    windSpeed: Math.round(c.wind_speed_10m ?? 0),
    label: currentInfo.label,
    icon: currentInfo.icon,
  };

  const daily: WeatherDay[] = d.time.map((date, i) => {
    const info = describeCode(d.weather_code?.[i] ?? -1);
    return {
      date,
      tempMax: Math.round(d.temperature_2m_max?.[i] ?? 0),
      tempMin: Math.round(d.temperature_2m_min?.[i] ?? 0),
      precipProb: Math.round(d.precipitation_probability_max?.[i] ?? 0),
      label: info.label,
      icon: info.icon,
    };
  });

  return { current, daily, updatedAt: new Date().toISOString() };
}

// Điểm vào chung — lấy toạ độ/tên địa điểm/số ngày từ cấu hình admin (Settings).
export async function getWeather(
  settings: Pick<AppSettings, "weatherLat" | "weatherLon" | "weatherForecastDays" | "weatherLocationName">
): Promise<WeatherData> {
  const rest = await fetchWeather(settings.weatherLat, settings.weatherLon, settings.weatherForecastDays);
  return { locationName: settings.weatherLocationName, ...rest };
}
