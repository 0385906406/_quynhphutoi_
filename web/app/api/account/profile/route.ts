import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { findById, updateUserProfile } from "@/lib/users";
import { adaptiveRecaptcha } from "@/lib/recaptcha";

// Cập nhật thông tin tài khoản: tên hiển thị + ảnh đại diện.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, avatar } = body;

  const cap = await adaptiveRecaptcha(req, "profile", body.recaptchaToken);
  if (cap) return cap;

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2) return NextResponse.json({ error: "Tên hiển thị phải có ít nhất 2 ký tự." }, { status: 400 });
  if (trimmed.length > 60) return NextResponse.json({ error: "Tên hiển thị quá dài (tối đa 60 ký tự)." }, { status: 400 });

  // avatar: chuỗi URL (https… hoặc /uploads/…); "" = xoá ảnh. Bỏ qua giá trị lạ.
  let avatarVal: string | null | undefined;
  if (typeof avatar === "string") {
    const a = avatar.trim();
    if (a && !/^(https?:\/\/|\/)/i.test(a)) {
      return NextResponse.json({ error: "Đường dẫn ảnh không hợp lệ." }, { status: 400 });
    }
    avatarVal = a.slice(0, 500); // "" → xoá; có giá trị → lưu
  }

  const u = await findById(session.id);
  if (!u) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });

  const updated = await updateUserProfile(session.id, { name: trimmed, avatar: avatarVal });
  // Cập nhật lại phiên để tên + ảnh mới hiển thị ngay trên thanh tài khoản.
  await createSession({ id: String(u._id), email: u.email, name: trimmed, avatar: updated?.avatar || "" });
  return NextResponse.json({ ok: true, name: trimmed, avatar: updated?.avatar || "" });
}
