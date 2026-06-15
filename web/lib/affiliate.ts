// Affiliate Shopee — admin cấu hình 1 DANH SÁCH link; nút "Xem thêm" ở cuối bài
// trỏ qua route trung gian /di/shopee, route chọn NGẪU NHIÊN 1 link rồi 302 sang
// Shopee (cloaking: link hiển thị là domain mình → đỡ bị chặn; đổi link không cần sửa bài).
// Lưu 1 document _id="shopee" trong collection "affiliate".
import { getDb } from "@/lib/db";
import { isShopeeUrl, type AffiliateConfig } from "@/lib/affiliate-shared";

// Re-export để các import cũ from "@/lib/affiliate" vẫn dùng được.
export { isShopeeUrl };
export type { AffiliateConfig };

const DEFAULTS: AffiliateConfig = {
  enabled: false,
  label: "Xem thêm trên Shopee",
  note: "Tài trợ",
  links: [],
};

const MAX_LINKS = 50;

type AffiliateDoc = { _id: string; config: Partial<AffiliateConfig> };

async function col() {
  const db = await getDb();
  return db.collection<AffiliateDoc>("affiliate");
}

export async function getAffiliateConfig(): Promise<AffiliateConfig> {
  try {
    const doc = await (await col()).findOne({ _id: "shopee" });
    return { ...DEFAULTS, ...(doc?.config ?? {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setAffiliateConfig(input: Partial<AffiliateConfig>): Promise<AffiliateConfig> {
  const cur = await getAffiliateConfig();
  const links = Array.isArray(input.links)
    ? Array.from(new Set(input.links.map((s) => String(s).trim()).filter(isShopeeUrl))).slice(0, MAX_LINKS)
    : cur.links;
  const next: AffiliateConfig = {
    enabled: typeof input.enabled === "boolean" ? input.enabled : cur.enabled,
    label: typeof input.label === "string" ? input.label.trim().slice(0, 80) || DEFAULTS.label : cur.label,
    note: typeof input.note === "string" ? input.note.trim().slice(0, 40) : cur.note,
    links,
  };
  await (await col()).updateOne({ _id: "shopee" }, { $set: { config: next } }, { upsert: true });
  return next;
}

// Chọn ngẫu nhiên 1 link hợp lệ (dùng ở route redirect). Trả null nếu không có.
export function pickRandomLink(links: string[]): string | null {
  const valid = links.filter(isShopeeUrl);
  if (valid.length === 0) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}
