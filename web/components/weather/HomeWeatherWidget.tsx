import Link from "next/link";
import { WeatherIcon } from "./WeatherIcon";
import type { WeatherData } from "@/lib/weather";

export function HomeWeatherWidget({ data, forecastDays }: { data: WeatherData | null; forecastDays: number }) {
  if (!data) return null;
  const { current, locationName } = data;
  return (
    <section className="qp-weather-widget">
      <div className="container-wide qp-weather-widget__inner">
        <span className="qp-weather-widget__icon"><WeatherIcon icon={current.icon} size={32} /></span>
        <span className="qp-weather-widget__temp">{current.temp}°C</span>
        <span className="qp-weather-widget__label">{current.label}</span>
        <span className="qp-weather-widget__loc">{locationName}</span>
        <Link className="qp-weather-widget__link" href="/thoi-tiet">
          Xem dự báo {forecastDays} ngày <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
