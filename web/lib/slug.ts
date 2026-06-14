// Tiện ích slug dùng chung cho mọi phân hệ. Tách từ bản trùng lặp ở jobs/lostfound/
// classifieds để code mới (admin CRUD content) dùng lại. slugify: bỏ dấu tiếng Việt,
// đ→d, lowercase, gạch nối. uniqueSlug: thêm hậu tố -2,-3… khi trùng trong collection.
import type { Collection, Document, Filter } from "mongodb";

export function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-");
}

// Sinh slug duy nhất trong `col`. `ignore` = slug hiện tại được phép giữ (khi sửa).
export async function uniqueSlug<T extends Document>(
  col: Collection<T>,
  base: string,
  fallback = "muc",
  ignore?: string,
): Promise<string> {
  const root = slugify(base) || fallback;
  let slug = root;
  let i = 2;
  for (;;) {
    const hit = await col.findOne({ slug } as unknown as Filter<T>);
    if (!hit || slug === ignore) break;
    slug = `${root}-${i++}`;
  }
  return slug;
}
