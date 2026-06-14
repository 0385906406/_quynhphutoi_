// Bộ đếm ký tự hiển thị cạnh nhãn ô nhập: "12/160". Đỏ khi chạm/vượt giới hạn.
export function CharCount({ value, max }: { value: string; max: number }) {
  const n = value?.length ?? 0;
  return (
    <span className={`qp-charcount${n >= max ? " is-max" : ""}`} aria-hidden>
      {n}/{max}
    </span>
  );
}
