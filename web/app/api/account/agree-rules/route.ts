// Ghi nhận người dùng đã đọc & đồng ý nội quy cộng đồng (cần đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setRulesAgreed } from "@/lib/users";
import { RULES_VERSION } from "@/lib/rules";

export async function POST() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const n = await setRulesAgreed(session.id, RULES_VERSION);
  if (!n) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
