// Admin: liệt kê người dùng (GET). Tạo user qua luồng đăng ký, không tạo ở đây.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listUsers, toUserRow, type UserRole } from "@/lib/users";

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const url = new URL(req.url);
  const search = url.searchParams.get("q") || undefined;
  const roleParam = url.searchParams.get("role");
  const role = roleParam === "admin" || roleParam === "user" ? (roleParam as UserRole) : undefined;
  const docs = await listUsers({ search, role, limit: 500 });
  return NextResponse.json({ items: docs.map(toUserRow), me: g.user._id!.toString() });
}
