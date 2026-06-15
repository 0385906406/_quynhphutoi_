// Admin: đọc (GET) & cập nhật (PATCH) cấu hình các khối trang chủ.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getHomeSections, setHomeSections, listHomeCandidates, type HomeSectionsConfig } from "@/lib/home-sections";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const [config, candidates] = await Promise.all([getHomeSections(), listHomeCandidates()]);
  return NextResponse.json({ config, candidates });
}

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  // setHomeSections() tự validate/clamp từng khối, bỏ qua field lạ.
  const config = await setHomeSections((b?.config ?? {}) as Partial<HomeSectionsConfig>);
  return NextResponse.json({ ok: true, config });
}
