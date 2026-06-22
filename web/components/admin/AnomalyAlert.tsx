"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/lib/datetime";

type AnomalyItem = {
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  count?: number;
  extra?: string;
  lastSeen: string;
};

const SEV: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  high:   { label: "Nguy hiểm", color: "#991b1b", bg: "rgba(239,68,68,0.08)",   border: "#fca5a5", dot: "#dc2626" },
  medium: { label: "Cảnh báo",  color: "#92400e", bg: "rgba(245,158,11,0.08)",  border: "#fcd34d", dot: "#d97706" },
  low:    { label: "Lưu ý",     color: "#1e3a5f", bg: "rgba(59,130,246,0.08)",  border: "#93c5fd", dot: "#3b82f6" },
};

const REFRESH_MS = 2 * 60 * 1000;

export function AnomalyAlert() {
  const [items, setItems]           = useState<AnomalyItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity-logs/anomalies");
      if (res.ok) {
        const d: { items: AnomalyItem[] } = await res.json();
        setItems(d.items);
        setLastRefresh(new Date().toISOString());
        if (d.items.some((i) => i.severity === "high")) setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const highCount = items.filter((i) => i.severity === "high").length;
  const hasAny    = items.length > 0;

  const panelBorder = highCount > 0
    ? "1px solid #fca5a5"
    : hasAny
      ? "1px solid #fcd34d"
      : "1px solid var(--color-border)";

  const panelBg = highCount > 0
    ? "rgba(239,68,68,0.03)"
    : hasAny
      ? "rgba(245,158,11,0.03)"
      : "var(--color-surface)";

  return (
    <div style={{
      marginBottom: "var(--space-4)", borderRadius: 8,
      border: panelBorder, background: panelBg, overflow: "hidden",
    }}>
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", cursor: "pointer", userSelect: "none",
          borderBottom: open && hasAny ? "1px solid var(--color-border)" : "none",
        }}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
      >
        {/* Dot indicator */}
        <span style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: loading ? "#9ca3af" : highCount > 0 ? "#dc2626" : hasAny ? "#d97706" : "#10b981",
          boxShadow: !loading && highCount > 0 ? "0 0 0 2px rgba(220,38,38,0.3)" : "none",
        }} />

        <span style={{ fontWeight: 700, fontSize: 14 }}>Hoạt động bất thường</span>

        {/* Badge */}
        {!loading && hasAny && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10,
            background: highCount > 0 ? "#dc2626" : "#d97706",
            color: "#fff", fontSize: 11, fontWeight: 700,
          }}>
            {items.length}
          </span>
        )}

        {!loading && !hasAny && (
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 500 }}>Bình thường</span>
        )}

        {loading && (
          <span style={{ fontSize: 12, color: "var(--color-gray-muted)" }}>Đang kiểm tra…</span>
        )}

        <span style={{ flex: 1 }} />

        {lastRefresh && (
          <span style={{ fontSize: 11, color: "var(--color-gray-muted)" }}>
            {formatDateTime(lastRefresh)}
          </span>
        )}

        <button
          type="button"
          className="qp-btn-outline"
          style={{ fontSize: 12, padding: "2px 10px" }}
          onClick={(e) => { e.stopPropagation(); load(); }}
        >
          Làm mới
        </button>

        <span style={{ fontSize: 12, color: "var(--color-gray-muted)", marginLeft: 4 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* Items */}
      {open && hasAny && (
        <div>
          {items.map((item, i) => {
            const s = SEV[item.severity] ?? SEV.low;
            return (
              <div
                key={`${item.type}-${i}`}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "10px 16px",
                  borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none",
                  borderLeft: `3px solid ${s.border}`,
                  background: s.bg,
                }}
              >
                {/* Severity badge */}
                <span style={{
                  display: "inline-block", flexShrink: 0, marginTop: 1,
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  color: s.color, border: `1px solid ${s.border}`,
                  background: "transparent", whiteSpace: "nowrap",
                }}>
                  {s.label}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>
                    {item.title}
                    {item.count !== undefined && (
                      <span style={{
                        marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "1px 6px",
                        borderRadius: 10, background: s.dot, color: "#fff",
                      }}>
                        {item.count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-gray-muted)", marginTop: 2 }}>
                    {item.detail}
                  </div>
                </div>

                {/* Time */}
                <span style={{
                  fontSize: 11, color: "var(--color-gray-muted)",
                  whiteSpace: "nowrap", flexShrink: 0, marginTop: 1,
                }}>
                  {formatDateTime(item.lastSeen)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
