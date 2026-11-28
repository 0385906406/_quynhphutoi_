// Affiliate Shopee — admin cấu hình danh sách link CHUNG + link RIÊNG theo từng trang.
// Nút "Xem thêm" cuối bài và nút nổi trên điện thoại trỏ qua route trung gian /di/shopee?p=<trang>;
// route chọn NGẪU NHIÊN 1 link của trang đó (chưa có thì dùng link chung) rồi 302 sang Shopee.
// Lưu 1 document _id="shopee" trong collection "affiliate".
import { getDb } from "@/lib/db";
import {
  isShopeeUrl, AFFILIATE_PAGES,
  type AffiliateConfig, type AffiliatePageConfig,
} from "@/lib/affiliate-shared";

// Re-export để các import cũ from "@/lib/affiliate" vẫn dùng được.
export { isShopeeUrl };
export type { AffiliateConfig };

const DEFAULTS: AffiliateConfig = {
  enabled: false,
  label: "Xem thêm trên Shopee",
  note: "Tài trợ",
  links: [],
  floatEnabled: false,
  floatLabel: "Ưu đãi hôm nay",
  pages: {},
};

const MAX_LINKS = 50;
const MAX_PAGE_LINKS = 20;
const PAGE_KEYS = new Set(AFFILIATE_PAGES.map((p) => p.key));

type AffiliateDoc = { _id: string; config: Partial<AffiliateConfig> };

async function col() {
  const db = await getDb();
  return db.collection<AffiliateDoc>("affiliate");
}

const cleanLinks = (list: unknown, max: number) =>
  Array.isArray(list)
    ? Array.from(new Set(list.map((s) => String(s).trim()).filter(isShopeeUrl))).slice(0, max)
    : [];

// Chỉ giữ trang có trong AFFILIATE_PAGES và có ít nhất 1 link hợp lệ.
function cleanPages(input: unknown): Record<string, AffiliatePageConfig> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, AffiliatePageConfig> = {};
  for (const [key, v] of Object.entries(input as Record<string, Partial<AffiliatePageConfig>>)) {
    if (!PAGE_KEYS.has(key) || !v) continue;
    const links = cleanLinks(v.links, MAX_PAGE_LINKS);
    if (!links.length) continue;
    out[key] = { label: typeof v.label === "string" ? v.label.trim().slice(0, 30) : "", links };
  }
  return out;
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
  const next: AffiliateConfig = {
    enabled: typeof input.enabled === "boolean" ? input.enabled : cur.enabled,
    label: typeof input.label === "string" ? input.label.trim().slice(0, 80) || DEFAULTS.label : cur.label,
    note: typeof input.note === "string" ? input.note.trim().slice(0, 40) : cur.note,
    links: Array.isArray(input.links) ? cleanLinks(input.links, MAX_LINKS) : cur.links,
    floatEnabled: typeof input.floatEnabled === "boolean" ? input.floatEnabled : cur.floatEnabled,
    floatLabel: typeof input.floatLabel === "string" ? input.floatLabel.trim().slice(0, 30) || DEFAULTS.floatLabel : cur.floatLabel,
    pages: input.pages !== undefined ? cleanPages(input.pages) : cur.pages,
  };
  await (await col()).updateOne({ _id: "shopee" }, { $set: { config: next } }, { upsert: true });
  return next;
}

// Danh sách link áp dụng cho 1 trang: link riêng nếu có, không thì link chung.
export function linksForPage(cfg: AffiliateConfig, pageKey: string | null): string[] {
  const own = pageKey ? cfg.pages[pageKey]?.links : undefined;
  return own?.length ? own : cfg.links;
}

// Chọn ngẫu nhiên 1 link hợp lệ (dùng ở route redirect). Trả null nếu không có.
export function pickRandomLink(links: string[]): string | null {
  const valid = links.filter(isShopeeUrl);
  if (valid.length === 0) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}
