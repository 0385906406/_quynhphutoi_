"use client";

import { useEffect, useState } from "react";
import { getAllHoroscopes, getZodiacEmoji, type Horoscope } from "@/lib/horoscope-api";

export function HoroscopeWidget() {
  const [horoscopes, setHoroscopes] = useState<Horoscope[]>([]);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAllHoroscopes();
      setHoroscopes(data);
      if (data.length > 0) {
        setSelectedSign(data[0].sign);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const selected = horoscopes.find((h) => h.sign === selectedSign);

  return (
    <div className="qp-widget">
      <div className="qp-widget__header" style={{ background: "linear-gradient(135deg, #8B5CF6, #A855F7)" }}>
        🔮 Chiêm tinh 12 con giáp
      </div>

      <div className="qp-widget__body">
        {loading ? (
          <div className="qp-widget__loading">Đang tải...</div>
        ) : (
          <>
            <div className="zodiac-selector">
              {horoscopes.map((h) => (
                <button
                  key={h.sign}
                  onClick={() => setSelectedSign(h.sign)}
                  className={`zodiac-btn ${selectedSign === h.sign ? "is-active" : ""}`}
                  title={h.vietnamese}
                >
                  {h.emoji}
                </button>
              ))}
            </div>

            {selected && (
              <div className="horoscope-content">
                <div className="horoscope-header">
                  <span className="zodiac-emoji">{selected.emoji}</span>
                  <span className="zodiac-name">{selected.vietnamese}</span>
                </div>

                <div className="horoscope-reading" style={{ background: "#F9FAFB", padding: "0.75rem", borderRadius: "6px", fontSize: "13px", lineHeight: "1.6", marginBottom: "1rem" }}>
                  {selected.reading}
                </div>

                <div className="horoscope-details">
                  <div className="detail">
                    <span className="label">May mắn:</span>
                    <span className="stars">{"⭐".repeat(selected.luckyLevel)}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Màu may:</span>
                    <span style={{ color: selected.luckyColor, fontWeight: "bold" }}>■ {selected.luckyColor}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Con số:</span>
                    <span className="number">{selected.luckyNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </>
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
          min-height: 220px;
        }

        .zodiac-selector {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .zodiac-btn {
          aspect-ratio: 1;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .zodiac-btn:hover {
          border-color: #8b5cf6;
          transform: scale(1.05);
        }

        .zodiac-btn.is-active {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          border-color: #8b5cf6;
          color: white;
        }

        .horoscope-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .horoscope-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .zodiac-emoji {
          font-size: 32px;
        }

        .zodiac-name {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
        }

        .horoscope-reading {
          text-align: left;
        }

        .horoscope-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 13px;
        }

        .detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          font-weight: 600;
          color: #6b7280;
        }

        .stars {
          font-size: 15px;
        }

        .number {
          font-weight: bold;
          color: #0066cc;
          font-size: 18px;
        }

        .qp-widget__loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
