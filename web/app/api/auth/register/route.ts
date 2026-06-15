import { NextResponse } from "next/server";
import { createUser, findByEmail } from "@/lib/users";
import { rateLimit, tooMany, clientIp } from "@/lib/ratelimit";
import { validatePassword } from "@/lib/password";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  if (!(await getSettings()).registerEnabled) {
    return NextResponse.json({ error: "Đăng ký tài khoản mới đang tạm khoá." }, { status: 403 });
  }
  // Chống tạo tài khoản hàng loạt / bom email xác minh: giới hạn theo IP.
  const ip = clientIp(req);
  const rl = await rateLimit(`register:ip:${ip}`, 5, 3600); // 5 tài khoản / giờ / IP
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn đăng ký quá nhiều lần. Vui lòng thử lại sau.");

  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;

  if (!(await verifyRecaptcha(body.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Vui lòng nhập đủ thông tin." }, { status: 400 });
  }
  const pwErr = validatePassword(String(password));
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (await findByEmail(email)) {
    return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 });
  }

  await createUser(email, name, password);

  // Không xác nhận email — tài khoản dùng được ngay, client điều hướng về trang đăng nhập.
  return NextResponse.json({ ok: true });
}
