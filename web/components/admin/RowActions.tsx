"use client";

// Gom các thao tác trên 1 dòng (Chi tiết / Duyệt / Sửa / Xoá…) vào 1 dropdown select.
// Dùng native <select> để không bị cắt trong bảng cuộn; chọn xong tự về nhãn mặc định.
export type RowAction = { value: string; label: string; run: () => void; hidden?: boolean };

export function RowActions({ actions, label = "Thao tác" }: { actions: RowAction[]; label?: string }) {
  const items = actions.filter((a) => !a.hidden);
  return (
    <select
      className="qp-select qp-rowactions"
      aria-label={label}
      value=""
      onChange={(e) => {
        const a = items.find((x) => x.value === e.target.value);
        if (a) a.run();
      }}
    >
      <option value="" disabled>{label}…</option>
      {items.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
    </select>
  );
}
