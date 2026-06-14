// Đơn vị hành chính (xã / thị trấn) — BẢNG CHUẨN HÓA dùng chung.
// Các bản ghi khác (trường học…) chỉ lưu khóa ngoại `wardSlug` rồi liên kết vào đây,
// KHÔNG lưu trùng tên xã / huyện / tỉnh / xã mới trong từng bản ghi.
import { getDb, ensureIndexes } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

export type AdminUnit = {
  _id?: import("mongodb").ObjectId;
  slug: string;            // khóa chính (FK target), vd "an-vu"
  name: string;            // tên đầy đủ xã/thị trấn CŨ, vd "Xã An Vũ"
  prefix: "Xã" | "Thị trấn";
  district: string;        // "Huyện Quỳnh Phụ"
  province: string;        // "Tỉnh Thái Bình"
  // Sau sáp nhập 1/7/2025: 35 đơn vị cũ → 9 xã mới thuộc Hưng Yên.
  newCommune: string;      // "Phụ Dực"
  newCommuneSlug: string;  // "phu-duc"
  newProvince: string;     // "Tỉnh Hưng Yên"
};

export async function adminUnits() {
  const db = await getDb();
  const col = db.collection<AdminUnit>("admin_units");
  await ensureIndexes("admin_units", () => Promise.all([
    col.createIndex({ slug: 1 }, { unique: true }),
    col.createIndex({ newCommuneSlug: 1 }),
  ]));
  return col;
}

export async function listAdminUnits() {
  return (await adminUnits()).find({}).sort({ name: 1 }).toArray();
}

export async function getAdminUnitBySlug(slug: string) {
  return (await adminUnits()).findOne({ slug });
}

// Nạp toàn bộ (35 đơn vị) thành Map để resolve nhanh khi hiển thị danh sách,
// tránh truy vấn lặp cho từng bản ghi.
export async function getAdminUnitsMap(): Promise<Map<string, AdminUnit>> {
  const all = await (await adminUnits()).find({}).toArray();
  return new Map(all.map((u) => [u.slug, u]));
}

// Địa chỉ cũ đầy đủ: "[đường], Xã …, Huyện …, Tỉnh …"
export function fullOldAddress(u: AdminUnit | undefined, street?: string) {
  if (!u) return street ?? "";
  return [street, u.name, u.district, u.province].filter(Boolean).join(", ");
}

// ---- Admin CRUD ----
export type AdminUnitInput = {
  name: string; prefix: "Xã" | "Thị trấn";
  district: string; province: string;
  newCommune: string; newCommuneSlug?: string; newProvince: string;
};

export async function createAdminUnit(input: AdminUnitInput) {
  const col = await adminUnits();
  const slug = await uniqueSlug(col, slugify(input.name.replace(/^(Xã|Thị trấn)\s+/i, "")), "don-vi");
  const doc: AdminUnit = {
    slug, name: input.name.trim(), prefix: input.prefix,
    district: input.district.trim(), province: input.province.trim(),
    newCommune: input.newCommune.trim(), newCommuneSlug: input.newCommuneSlug?.trim() || slugify(input.newCommune),
    newProvince: input.newProvince.trim(),
  };
  const { insertedId } = await col.insertOne(doc);
  return { ...doc, _id: insertedId };
}

export async function updateAdminUnit(slug: string, patch: Partial<AdminUnitInput>) {
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) set[k] = typeof v === "string" ? v.trim() : v;
  if (patch.newCommune && !patch.newCommuneSlug) set.newCommuneSlug = slugify(patch.newCommune);
  if (Object.keys(set).length === 0) return 0;
  const res = await (await adminUnits()).updateOne({ slug }, { $set: set });
  return res.matchedCount;
}

export async function deleteAdminUnit(slug: string) {
  const res = await (await adminUnits()).deleteOne({ slug });
  return res.deletedCount;
}

export type AdminUnitRow = AdminUnit & { slug: string };
export function toAdminUnitRow(d: AdminUnit): AdminUnitRow {
  return {
    slug: d.slug, name: d.name, prefix: d.prefix, district: d.district, province: d.province,
    newCommune: d.newCommune, newCommuneSlug: d.newCommuneSlug, newProvince: d.newProvince,
  };
}
