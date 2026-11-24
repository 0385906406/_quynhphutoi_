"use client";

import { useEffect, useState } from "react";
import { getWeather, getWeatherEmoji, getWeatherText, type WeatherData } from "@/lib/weather-api";

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getWeather(20.8, 106.4); // Quỳnh Phụ coordinates
      setWeather(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="qp-widget">
      <div className="qp-widget__header" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
        🌤️ Thời tiết Hôm nay
      </div>

      <div className="qp-widget__body">
        {loading ? (
          <div className="qp-widget__loading">Đang tải...</div>
        ) : weather ? (
          <div className="weather-content">
            <div className="weather-main">
              <div className="weather-emoji">{getWeatherEmoji(weather.weatherCode)}</div>
              <div className="weather-temp">{Math.round(weather.temperature)}°C</div>
              <div className="weather-condition">{getWeatherText(weather.weatherCode)}</div>
              <div className="weather-location">{weather.location}</div>
            </div>

            <div className="weather-details">
              <div className="detail-item">
                <span className="detail-label">Độ ẩm</span>
                <span className="detail-value">{weather.humidity}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gió</span>
                <span className="detail-value">{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="qp-widget__error">Không thể tải dữ liệu</div>
        )}
      </div>

      <style jsx>{`
        .qp-widget {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .qp-widget__header {
          color: white;
          padding: 1rem;
          font-weight: 600;
          font-size: 18px;
        }

        .qp-widget__body {
          padding: 1.5rem;
          min-height: 200px;
        }

        .weather-content {
          text-align: center;
        }

        .weather-main {
          margin-bottom: 1.5rem;
        }

        .weather-emoji {
          font-size: 48px;
          margin-bottom: 0.5rem;
        }

        .weather-temp {
          font-size: 36px;
          font-weight: bold;
          color: #0066cc;
          line-height: 1;
        }

        .weather-condition {
          font-size: 15px;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .weather-location {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .weather-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .qp-widget__loading,
        .qp-widget__error {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
