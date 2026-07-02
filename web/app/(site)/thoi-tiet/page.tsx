import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/page-seo";
import { JsonLd } from "@/components/common/JsonLd";
import { jsonLdBreadcrumb } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { getWeather } from "@/lib/weather";
import { WeatherPanel } from "@/components/weather/WeatherPanel";

export async function generateMetadata() {
  const settings = await getSettings();
  return pageMetadata({
    key: "/thoi-tiet", path: "/thoi-tiet",
    title: `Thời tiết ${settings.weatherLocationName}`,
    description: `Nhiệt độ hiện tại và dự báo thời tiết ${settings.weatherForecastDays} ngày tới cho ${settings.weatherLocationName}.`,
  });
}

export const dynamic = "force-dynamic";

export default async function ThoiTietPage() {
  const settings = await getSettings();
  if (!settings.weatherEnabled) notFound();

  const weather = await getWeather(settings).catch(() => null);

  return (
    <>
      <JsonLd data={[jsonLdBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Thời tiết", path: "/thoi-tiet" }])]} />
      <section className="qp-pagehero" aria-labelledby="tt-title">
        <span className="qp-pagehero__blob is-teal" aria-hidden />
        <span className="qp-pagehero__blob is-indigo" aria-hidden />
        <span className="qp-pagehero__blob is-yellow" aria-hidden />
        <span className="qp-pagehero__art" aria-hidden />
        <div className="container-wide qp-pagehero__inner">
          <nav className="qp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span className="qp-breadcrumb__sep">›</span>
            <span className="qp-breadcrumb__current">Thời tiết</span>
          </nav>
          <span className="type-tag qp-pagehero__eyebrow">Tiện ích · Thời tiết</span>
          <h1 id="tt-title" className="type-h1">Thời tiết {settings.weatherLocationName}</h1>
          <p className="qp-pagehero__lead">
            Nhiệt độ hiện tại và dự báo {settings.weatherForecastDays} ngày tới, cập nhật từ Open-Meteo.
          </p>
          <span className="qp-pagehero__line" aria-hidden />
        </div>
      </section>

      <section className="section">
        <div className="container-wide">
          {weather ? (
            <WeatherPanel data={weather} />
          ) : (
            <div className="qp-alert is-error" role="alert">
              <svg className="qp-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
              <div className="qp-alert__body"><strong>Không lấy được dữ liệu thời tiết.</strong> Vui lòng thử lại sau.</div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
