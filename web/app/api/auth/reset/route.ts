import { NextResponse } from "next/server";
import { resetPasswordByToken } from "@/lib/users";
import { validatePassword } from "@/lib/password";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, password } = body;

  if (!(await verifyRecaptcha(body.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }

  const pwErr = validatePassword(String(password || ""));
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  const u = await resetPasswordByToken(token || "", password);
  if (!u) {
    return NextResponse.json({ error: "Liên kết không hợp lệ hoặc đã hết hạn." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
