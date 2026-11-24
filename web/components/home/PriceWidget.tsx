"use client";

import { useEffect, useState } from "react";
import { getGoldPrice, getExchangeRates, formatPrice, getPriceChangeColor, type GoldPrice, type ExchangeRate } from "@/lib/price-api";

export function PriceWidget() {
  const [gold, setGold] = useState<GoldPrice | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [activeTab, setActiveTab] = useState<"gold" | "rates">("gold");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [goldData, ratesData] = await Promise.all([getGoldPrice("sjc"), getExchangeRates()]);
      setGold(goldData);
      setRates(ratesData);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="qp-widget">
      <div className="qp-widget__header" style={{ background: "linear-gradient(135deg, #EC4899, #BE185D)" }}>
        💰 Giá vàng & Tỷ giá
      </div>

      <div className="qp-widget__body">
        <div className="qp-widget__tabs">
          <button
            onClick={() => setActiveTab("gold")}
            className={`qp-widget__tab ${activeTab === "gold" ? "is-active" : ""}`}
          >
            Vàng SJC
          </button>
          <button
            onClick={() => setActiveTab("rates")}
            className={`qp-widget__tab ${activeTab === "rates" ? "is-active" : ""}`}
          >
            Tỷ giá
          </button>
        </div>

        {loading ? (
          <div className="qp-widget__loading">Đang tải...</div>
        ) : activeTab === "gold" && gold ? (
          <div className="price-content">
            <div className="price-row">
              <span>Mua:</span>
              <span className="price-value">{formatPrice(gold.buy)} VNĐ</span>
            </div>
            <div className="price-row">
              <span>Bán:</span>
              <span className="price-value">{formatPrice(gold.sell)} VNĐ</span>
            </div>
            {gold.change && (
              <div className="price-row" style={{ color: getPriceChangeColor(gold.change) }}>
                <span>Thay đổi:</span>
                <span>{gold.change > 0 ? "↑" : "↓"} {formatPrice(Math.abs(gold.change))} VNĐ</span>
              </div>
            )}
          </div>
        ) : activeTab === "rates" && rates.length > 0 ? (
          <div className="rates-table">
            {rates.slice(0, 3).map((rate) => (
              <div key={rate.code} className="rate-row">
                <span className="rate-code">{rate.code}</span>
                <span className="rate-price">{rate.buy.toLocaleString("vi-VN")}</span>
              </div>
            ))}
          </div>
        ) : null}
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
          min-height: 180px;
        }

        .qp-widget__tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
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
          font-size: 13px;
          transition: all 0.2s;
        }

        .qp-widget__tab.is-active {
          background: #ec4899;
          color: white;
        }

        .price-content,
        .rates-table {
          font-size: 14px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .price-value {
          font-weight: bold;
          color: #0066cc;
          text-align: right;
          font-family: monospace;
        }

        .rate-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .rate-code {
          font-weight: 600;
        }

        .rate-price {
          font-family: monospace;
          color: #0066cc;
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
