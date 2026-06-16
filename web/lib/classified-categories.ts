// Hằng số danh mục / tình trạng cho Mua bán — client-safe (KHÔNG import MongoDB),
// để dùng được trong cả client component (modal) lẫn server.
// Danh mục nay QUẢN LÝ ĐƯỢC trong admin (collection categories, module "mua-ban").
// Type để mở (string) — danh sách dưới đây chỉ là FALLBACK khi DB chưa seed.
export type ClassifiedCategory = string;
export type ClassifiedCondition = "moi" | "da-dung";

export const CLASSIFIED_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "xe-co", label: "Xe cộ" },
  { slug: "bat-dong-san", label: "Nhà đất" },
  { slug: "dien-tu", label: "Điện tử - Điện máy" },
  { slug: "do-gia-dung", label: "Đồ gia dụng - Nội thất" },
  { slug: "nong-san-vat-nuoi", label: "Nông sản - Vật nuôi" },
  { slug: "thoi-trang", label: "Thời trang - Mẹ & bé" },
  { slug: "khac", label: "Đồ khác" },
];
export const categoryLabel = (c: string) => CLASSIFIED_CATEGORIES.find((x) => x.slug === c)?.label ?? c;
export const CONDITION_LABEL: Record<ClassifiedCondition, string> = { moi: "Mới", "da-dung": "Đã sử dụng" };
