// Màn hình chờ trong khu quản trị (giữ nguyên thanh bên).
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Đang tải" style={{ display: "grid", gap: 18 }}>
      <span className="qp-skel qp-skel--title" />
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {Array.from({ length: 4 }, (_, i) => <span key={i} className="qp-skel" style={{ height: 96 }} />)}
      </div>
      <span className="qp-skel" style={{ height: 260 }} />
      <span className="qp-skel" style={{ height: 180 }} />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
