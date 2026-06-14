// Guard dùng chung cho API admin. Trả về { user } nếu hợp lệ, hoặc NextResponse lỗi
// (401 chưa đăng nhập / 403 không phải admin) để route return thẳng.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin, type UserDoc } from "@/lib/users";

export async function requireAdmin(): Promise<{ user: UserDoc } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Chỉ admin." }, { status: 403 });
  return { user };
}
