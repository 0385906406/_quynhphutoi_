import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { findById, updateUserName } from "@/lib/users";
import { verifyRecaptcha } from "@/lib/recaptcha";

// Cập nhật thông tin tài khoản (hiện tại: tên hiển thị).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!(await verifyRecaptcha(body.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2) return NextResponse.json({ error: "Tên hiển thị phải có ít nhất 2 ký tự." }, { status: 400 });
  if (trimmed.length > 60) return NextResponse.json({ error: "Tên hiển thị quá dài (tối đa 60 ký tự)." }, { status: 400 });

  const u = await findById(session.id);
  if (!u) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });

  await updateUserName(session.id, trimmed);
  // Cập nhật lại phiên để tên mới hiển thị ngay trên thanh tài khoản.
  await createSession({ id: String(u._id), email: u.email, name: trimmed });
  return NextResponse.json({ ok: true, name: trimmed });
}
