"use client";

// Modal nội quy hiện cho người dùng ĐÃ ĐĂNG NHẬP nhưng CHƯA đồng ý (hoặc đồng ý
// phiên bản cũ). Bắt buộc tích "đã đọc & đồng ý" rồi bấm Tôi đồng ý → lưu vào DB.
// Không có nút đóng / không đóng khi bấm ra ngoài để khuyến khích đọc kỹ.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import { useToast } from "@/components/common/Toast";
import {
  RULES_TITLE, RULES_INTRO, RULES_ITEMS, RULES_NOTE, RULES_OUTRO, RULES_SIGNATURE,
} from "@/lib/rules";

export function RulesGate({ needsAgreement }: { needsAgreement: boolean }) {
  const [open, setOpen] = useState(needsAgreement);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useModalDismiss(open, () => {}); // khóa cuộn nền; KHÔNG cho Esc đóng (bắt buộc xác nhận)

  if (!open) return null;

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/agree-rules", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Lưu xác nhận thất bại, vui lòng thử lại.");
        return;
      }
      setOpen(false);
      toast.success("Cảm ơn bạn đã đồng ý với quy định cộng đồng.");
      router.refresh();
    } catch {
      toast.error("Lỗi kết nối, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="qp-modal-overlay">
      <div className="qp-modal qp-modal--wide" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={(e) => e.stopPropagation()}>
        <div className="qp-modal__head">
          <h2 id="rules-title" className="type-h3">{RULES_TITLE}</h2>
        </div>

        <div className="qp-modal__body qp-rules-body">
          <p className="type-body">{RULES_INTRO}</p>
          <ol className="qp-rules-list">
            {RULES_ITEMS.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
          <p className="type-body-small text-muted">{RULES_NOTE}</p>
          <p className="type-body">{RULES_OUTRO}</p>
          <p className="type-body"><b>{RULES_SIGNATURE}</b></p>

          <label className="qp-check" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            Tôi đã đọc và đồng ý với quy định đăng bài của cộng đồng.
          </label>
        </div>

        <div className="qp-modal__foot">
          <Link href="/noi-quy" className="qp-btn-outline" target="_blank">Xem chi tiết</Link>
          <button type="button" className="qp-btn-primary" disabled={!agree || busy} onClick={confirm}>
            {busy ? "Đang lưu…" : "Tôi đồng ý"}
          </button>
        </div>
      </div>
    </div>
  );
}
