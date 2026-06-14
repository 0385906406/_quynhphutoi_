// Hằng số danh mục / tình trạng cho Mua bán — client-safe (KHÔNG import MongoDB),
// để dùng được trong cả client component (modal) lẫn server.
export type ClassifiedCategory =
  | "xe-co" | "bat-dong-san" | "dien-tu" | "do-gia-dung" | "nong-san-vat-nuoi" | "thoi-trang" | "khac";
export type ClassifiedCondition = "moi" | "da-dung";

export const CLASSIFIED_CATEGORIES: { slug: ClassifiedCategory; label: string }[] = [
  { slug: "xe-co", label: "Xe cộ" },
  { slug: "bat-dong-san", label: "Nhà đất" },
  { slug: "dien-tu", label: "Điện tử - Điện máy" },
  { slug: "do-gia-dung", label: "Đồ gia dụng - Nội thất" },
  { slug: "nong-san-vat-nuoi", label: "Nông sản - Vật nuôi" },
  { slug: "thoi-trang", label: "Thời trang - Mẹ & bé" },
  { slug: "khac", label: "Đồ khác" },
];
export const categoryLabel = (c: ClassifiedCategory) => CLASSIFIED_CATEGORIES.find((x) => x.slug === c)?.label ?? c;
export const CONDITION_LABEL: Record<ClassifiedCondition, string> = { moi: "Mới", "da-dung": "Đã sử dụng" };
