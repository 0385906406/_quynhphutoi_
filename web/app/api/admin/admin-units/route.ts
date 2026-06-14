// Admin: liệt kê (GET) & tạo (POST) đơn vị hành chính (xã / thị trấn).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listAdminUnits, createAdminUnit, toAdminUnitRow } from "@/lib/admin-units";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const docs = await listAdminUnits();
  return NextResponse.json({ items: docs.map(toAdminUnitRow) });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));

  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "Nhập tên đơn vị." }, { status: 400 });
  const prefix = b.prefix === "Thị trấn" ? "Thị trấn" : "Xã";
  const newCommune = String(b.newCommune || "").trim();
  if (!newCommune) return NextResponse.json({ error: "Nhập xã mới sau sáp nhập." }, { status: 400 });

  const created = await createAdminUnit({
    name, prefix,
    district: String(b.district || "Huyện Quỳnh Phụ"),
    province: String(b.province || "Tỉnh Thái Bình"),
    newCommune, newCommuneSlug: b.newCommuneSlug,
    newProvince: String(b.newProvince || "Tỉnh Hưng Yên"),
  });
  return NextResponse.json({ ok: true, item: toAdminUnitRow(created) });
}
