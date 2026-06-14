"use client";

// Lỗi nghiêm trọng ở layout gốc → tự dựng <html>/<body> độc lập (CSS hệ thống có thể không sẵn).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", background: "#fff", color: "#0b2540" }}>
        <div style={{ textAlign: "center", padding: 24, maxWidth: 460 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: "-3px", background: "linear-gradient(135deg,#00a98f,#5b6cff)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>500</div>
          <h1 style={{ fontSize: 26, margin: "10px 0 10px" }}>Đã có lỗi xảy ra</h1>
          <p style={{ color: "#5b6b7b", lineHeight: 1.65, margin: "0 0 22px" }}>Hệ thống gặp sự cố. Vui lòng thử lại sau giây lát.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={reset} style={{ padding: "11px 22px", borderRadius: 10, border: "none", background: "#0b2540", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>↻ Thử lại</button>
            {/* Tải lại toàn trang (thuần <a>) để khôi phục khỏi trạng thái lỗi nghiêm trọng. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ padding: "11px 22px", borderRadius: 10, border: "1px solid #d8dee5", background: "#fff", color: "#0b2540", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>Về trang chủ</a>
          </div>
        </div>
      </body>
    </html>
  );
}
