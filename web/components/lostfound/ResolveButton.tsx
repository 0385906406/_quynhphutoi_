"use client";

// Nút cho chủ tin đánh dấu "đã trả / đã tìm thấy" → POST resolve, refresh trang.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";

export function ResolveButton({ slug, kind }: { slug: string; kind: "tim-do" | "nhat-duoc" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function resolve() {
    if (!confirm("Đánh dấu tin này đã hoàn tất? Tin sẽ hiển thị trạng thái đã trả/đã tìm thấy.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lost-found/${slug}/resolve`, { method: "POST" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Thất bại."); return; }
      router.refresh();
    } catch { toast.error("Lỗi kết nối."); } finally { setLoading(false); }
  }

  return (
    <div>
      <button type="button" className="qp-btn-primary" onClick={resolve} disabled={loading}>
        {loading ? "Đang lưu…" : kind === "tim-do" ? "✓ Đã tìm thấy đồ" : "✓ Đã trả lại đồ"}
      </button>
    </div>
  );
}
