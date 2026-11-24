"use client";

import { useEffect, useState } from "react";
import { getLotteryResults, type LotteryData, type LotteryRegion } from "@/lib/lottery-api";

export function LotteryWidget() {
  const [data, setData] = useState<Record<LotteryRegion, LotteryData | null>>({
    xsmb: null,
    xsmn: null,
    xsmt: null,
  });
  const [activeTab, setActiveTab] = useState<LotteryRegion>("xsmb");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [xsmb, xsmn, xsmt] = await Promise.all([
        getLotteryResults("xsmb"),
        getLotteryResults("xsmn"),
        getLotteryResults("xsmt"),
      ]);
      setData({ xsmb, xsmn, xsmt });
      setLoading(false);
    };
    fetchData();
  }, []);

  const current = data[activeTab];

  return (
    <div className="qp-widget qp-widget--lottery">
      <div className="qp-widget__header" style={{ background: "linear-gradient(135deg, #FF6B35, #E55100)" }}>
        🎰 Sổ số Hôm nay
      </div>

      <div className="qp-widget__body">
        <div className="qp-widget__tabs">
          {(["xsmb", "xsmn", "xsmt"] as LotteryRegion[]).map((region) => (
            <button
              key={region}
              onClick={() => setActiveTab(region)}
              className={`qp-widget__tab ${activeTab === region ? "is-active" : ""}`}
            >
              {region.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="qp-widget__content">
          {loading ? (
            <div className="qp-widget__loading">Đang tải...</div>
          ) : current ? (
            <div className="lottery-results">
              {current.prizes.first && (
                <div className="lottery-prize">
                  <strong>Giải 1:</strong>
                  <span className="prize-value" style={{ color: "#10B981" }}>
                    {current.prizes.first}
                  </span>
                </div>
              )}

              {current.prizes.second && current.prizes.second.length > 0 && (
                <div className="lottery-prize">
                  <strong>Giải 2:</strong>
                  <span className="prize-values">{current.prizes.second.join(", ")}</span>
                </div>
              )}

              {current.prizes.third && current.prizes.third.length > 0 && (
                <div className="lottery-prize">
                  <strong>Giải 3:</strong>
                  <span className="prize-values">{current.prizes.third.slice(0, 3).join(", ")}...</span>
                </div>
              )}

              <div className="qp-widget__footer-text">Cập nhật lúc {new Date(current.updatedAt).toLocaleTimeString("vi-VN")}</div>
            </div>
          ) : (
            <div className="qp-widget__error">Không thể tải dữ liệu</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .qp-widget {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .qp-widget:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .qp-widget__header {
          color: white;
          padding: 1rem;
          font-weight: 600;
          font-size: 18px;
        }

        .qp-widget__body {
          padding: 1.5rem;
        }

        .qp-widget__tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .qp-widget__tab {
          flex: 1;
          padding: 0.5rem;
          border: none;
          background: white;
          color: #6b7280;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .qp-widget__tab.is-active {
          background: #ff6b35;
          color: white;
        }

        .qp-widget__tab:hover {
          background: #f3f4f6;
        }

        .qp-widget__tab.is-active:hover {
          background: #e55100;
        }

        .qp-widget__content {
          min-height: 150px;
        }

        .lottery-results {
          font-family: monospace;
          font-size: 15px;
          line-height: 2;
        }

        .lottery-prize {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .prize-value {
          font-weight: bold;
          font-size: 18px;
          text-align: right;
        }

        .prize-values {
          text-align: right;
          word-break: break-all;
        }

        .qp-widget__loading,
        .qp-widget__error {
          text-align: center;
          padding: 2rem 1rem;
          color: #6b7280;
        }

        .qp-widget__footer-text {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 1rem;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
