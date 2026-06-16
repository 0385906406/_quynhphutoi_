import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findById, checkPassword, setUserPassword } from "@/lib/users";
import { validatePassword } from "@/lib/password";
import { adaptiveRecaptcha } from "@/lib/recaptcha";

// Đổi mật khẩu — yêu cầu nhập đúng mật khẩu hiện tại.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { current, next } = body;

  const cap = await adaptiveRecaptcha(req, "password", body.recaptchaToken);
  if (cap) return cap;

  const pwErr = validatePassword(typeof next === "string" ? next : "");
  if (pwErr) return NextResponse.json({ error: pwErr.replace("Mật khẩu", "Mật khẩu mới") }, { status: 400 });

  const u = await findById(session.id);
  if (!u) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });

  if (!(await checkPassword(u, typeof current === "string" ? current : ""))) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 400 });
  }
  if (current === next) {
    return NextResponse.json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại." }, { status: 400 });
  }

  await setUserPassword(session.id, next);
  return NextResponse.json({ ok: true });
}
