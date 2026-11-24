"use client";

import { useEffect, useState } from "react";
import { getTodayMatches, getMatchStatus, type FootballMatch } from "@/lib/football-api";

export function FootballWidget() {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getTodayMatches();
      setMatches(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="qp-widget" style={{ background: "white" }}>
      <div className="qp-widget__header" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
        ⚽ Bóng đá Live
      </div>

      <div className="qp-widget__body">
        {loading ? (
          <div className="qp-widget__loading">Đang tải...</div>
        ) : matches.length === 0 ? (
          <div className="qp-widget__empty">Không có trận đấu hôm nay</div>
        ) : (
          <div className="matches-list">
            {matches.slice(0, 5).map((match) => (
              <div
                key={match.id}
                className={`match-card ${match.status === "LIVE" ? "is-live" : ""}`}
                style={{
                  background: match.status === "LIVE" ? "#ecfdf5" : "white",
                  borderLeft: match.status === "LIVE" ? "4px solid #10B981" : "1px solid #e5e7eb",
                }}
              >
                <div className="match-score">
                  <span className="team">{match.homeTeam}</span>
                  <span className="score">
                    {match.homeGoals} : {match.awayGoals}
                  </span>
                  <span className="team">{match.awayTeam}</span>
                </div>
                <div className="match-meta">
                  <span className="league">{match.league}</span>
                  <span className="status">{getMatchStatus(match)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .qp-widget {
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
          min-height: 200px;
        }

        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .match-card {
          padding: 1rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .match-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .match-card.is-live {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }

        .match-score {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-size: 15px;
        }

        .team {
          flex: 1;
          text-align: center;
        }

        .score {
          flex: 0.4;
          text-align: center;
          font-size: 18px;
          color: #0066cc;
          font-weight: bold;
        }

        .match-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }

        .league {
          font-weight: 500;
        }

        .status {
          text-align: right;
        }

        .qp-widget__loading,
        .qp-widget__empty {
          text-align: center;
          padding: 2rem 1rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
