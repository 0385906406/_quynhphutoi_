// Seed bảng đơn vị hành chính (admin_units) — 35 xã/thị trấn cũ của huyện Quỳnh Phụ
// kèm xã mới sau sáp nhập 2025. Idempotent: upsert theo slug + prune.
// Chạy: npm run seed:admin-units
import { MongoClient } from "mongodb";
import { isCli } from "./_cli";
import type { AdminUnit } from "../lib/admin-units";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";
const D = "Huyện Quỳnh Phụ";
const P = "Tỉnh Thái Bình";
const NP = "Tỉnh Hưng Yên";

const NEW_SLUG: Record<string, string> = {
  "Quỳnh Phụ": "quynh-phu", "Minh Thọ": "minh-tho", "Nguyễn Du": "nguyen-du",
  "Quỳnh An": "quynh-an", "Ngọc Lâm": "ngoc-lam", "Đồng Bằng": "dong-bang",
  "A Sào": "a-sao", "Phụ Dực": "phu-duc", "Tân Tiến": "tan-tien",
};

// [slug, tên đầy đủ, xã mới]
const UNITS: [string, string, string][] = [
  ["quynh-coi", "Thị trấn Quỳnh Côi", "Quỳnh Phụ"],
  ["an-bai", "Thị trấn An Bài", "Phụ Dực"],
  ["an-ap", "Xã An Ấp", "Đồng Bằng"],
  ["an-cau", "Xã An Cầu", "Đồng Bằng"],
  ["an-dong", "Xã An Đồng", "A Sào"],
  ["an-duc", "Xã An Dục", "Tân Tiến"],
  ["an-hiep", "Xã An Hiệp", "A Sào"],
  ["an-khe", "Xã An Khê", "A Sào"],
  ["an-le", "Xã An Lễ", "Đồng Bằng"],
  ["an-my", "Xã An Mỹ", "Phụ Dực"],
  ["an-ninh", "Xã An Ninh", "Phụ Dực"],
  ["an-quy", "Xã An Quý", "Đồng Bằng"],
  ["an-thai", "Xã An Thái", "A Sào"],
  ["an-thanh", "Xã An Thanh", "Phụ Dực"],
  ["an-trang", "Xã An Tràng", "Tân Tiến"],
  ["an-vinh", "Xã An Vinh", "Quỳnh An"],
  ["an-vu", "Xã An Vũ", "Phụ Dực"],
  ["dong-hai", "Xã Đông Hải", "Quỳnh An"],
  ["dong-tien", "Xã Đồng Tiến", "Tân Tiến"],
  ["quynh-giao", "Xã Quỳnh Giao", "Minh Thọ"],
  ["quynh-hai", "Xã Quỳnh Hải", "Quỳnh Phụ"],
  ["quynh-hoa", "Xã Quỳnh Hoa", "Minh Thọ"],
  ["quynh-hoang", "Xã Quỳnh Hoàng", "Ngọc Lâm"],
  ["quynh-hoi", "Xã Quỳnh Hội", "Quỳnh Phụ"],
  ["quynh-hong", "Xã Quỳnh Hồng", "Quỳnh Phụ"],
  ["quynh-hung", "Xã Quỳnh Hưng", "Quỳnh Phụ"],
  ["quynh-khe", "Xã Quỳnh Khê", "Nguyễn Du"],
  ["quynh-lam", "Xã Quỳnh Lâm", "Ngọc Lâm"],
  ["quynh-minh", "Xã Quỳnh Minh", "Minh Thọ"],
  ["quynh-my", "Xã Quỳnh Mỹ", "Quỳnh Phụ"],
  ["quynh-ngoc", "Xã Quỳnh Ngọc", "Ngọc Lâm"],
  ["quynh-nguyen", "Xã Quỳnh Nguyên", "Nguyễn Du"],
  ["quynh-tho", "Xã Quỳnh Thọ", "Minh Thọ"],
  ["chau-son", "Xã Châu Sơn", "Nguyễn Du"],
  ["trang-bao-xa", "Xã Trang Bảo Xá", "Quỳnh An"],
];

export function seedDocs(): AdminUnit[] {
  return UNITS.map(([slug, name, newCommune]) => ({
    slug, name,
    prefix: name.startsWith("Thị trấn") ? "Thị trấn" : "Xã",
    district: D, province: P,
    newCommune, newCommuneSlug: NEW_SLUG[newCommune], newProvince: NP,
  }));
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db(dbName).collection<AdminUnit>("admin_units");
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ newCommuneSlug: 1 });

    const seen: string[] = [];
    for (const [slug, name, newCommune] of UNITS) {
      const unit: AdminUnit = {
        slug, name,
        prefix: name.startsWith("Thị trấn") ? "Thị trấn" : "Xã",
        district: D, province: P,
        newCommune, newCommuneSlug: NEW_SLUG[newCommune], newProvince: NP,
      };
      await col.updateOne({ slug }, { $set: unit }, { upsert: true });
      seen.push(slug);
    }
    const pruned = await col.deleteMany({ slug: { $nin: seen } });
    console.log(`✓ Đơn vị hành chính: ${seen.length}` + (pruned.deletedCount ? ` (dọn ${pruned.deletedCount})` : ""));
    console.log(`✅ Đã seed admin_units vào "${dbName}".`);
  } finally {
    await client.close();
  }
}
if (isCli(import.meta.url)) main().catch((e) => { console.error("❌ Seed thất bại:", e); process.exit(1); });
