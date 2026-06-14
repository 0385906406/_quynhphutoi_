// Seed dữ liệu mẫu cho các module nội dung (Dịch vụ công + Khám phá).
// AN TOÀN: chỉ nạp vào collection ĐANG RỖNG — không bao giờ ghi đè/xoá dữ liệu thật.
// Dùng qua nút "Nạp dữ liệu mẫu" trong admin (route /api/admin/seed).
// Lấy dữ liệu trực tiếp từ các script seed (seedDocs) để không trùng lặp data.
import { getDb } from "@/lib/db";
import { seedDocs as schools } from "../seeds/schools";
import { seedDocs as health } from "../seeds/health";
import { seedDocs as transit } from "../seeds/transit";
import { seedDocs as market } from "../seeds/market";
import { seedDocs as relics } from "../seeds/relics";
import { seedDocs as district } from "../seeds/district";
import { seedDocs as adminUnits } from "../seeds/admin-units";

export type SeedReport = { label: string; status: "seeded" | "skipped"; count: number };

// Thứ tự: admin_units trước (các module khác hiển thị tên xã dựa vào nó).
const MODULES: { label: string; col: string; docs: () => Record<string, unknown>[] }[] = [
  { label: "Đơn vị hành chính", col: "admin_units", docs: adminUnits },
  { label: "Tổng quan (hồ sơ huyện)", col: "district", docs: district },
  { label: "Trường học", col: "schools", docs: schools },
  { label: "Y tế", col: "health", docs: health },
  { label: "Giao thông", col: "transit", docs: transit },
  { label: "Chợ", col: "market", docs: market },
  { label: "Di tích", col: "relics", docs: relics },
];

export async function seedDemoData(): Promise<SeedReport[]> {
  const db = await getDb();
  const report: SeedReport[] = [];
  for (const m of MODULES) {
    const col = db.collection(m.col);
    const existing = await col.countDocuments();
    if (existing > 0) {
      report.push({ label: m.label, status: "skipped", count: existing });
      continue;
    }
    const docs = m.docs();
    if (docs.length) await col.insertMany(docs);
    report.push({ label: m.label, status: "seeded", count: docs.length });
  }
  return report;
}
