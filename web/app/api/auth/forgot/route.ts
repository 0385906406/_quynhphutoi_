import { NextResponse } from "next/server";
import { setResetToken } from "@/lib/users";
import { sendResetEmail } from "@/lib/mailer";
import { rateLimit, tooMany, clientIp } from "@/lib/ratelimit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: Request) {
  // Chống bom email đặt lại mật khẩu: giới hạn theo IP.
  const ip = clientIp(req);
  const rl = await rateLimit(`forgot:ip:${ip}`, 5, 3600); // 5 lần / giờ / IP
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn yêu cầu quá nhiều lần. Vui lòng thử lại sau.");

  const body = await req.json().catch(() => ({}));
  const { email } = body;

  if (!(await verifyRecaptcha(body.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }

  const res = await setResetToken(email || "");
  if (res) {
    const link = `${process.env.APP_URL}/dat-lai-mat-khau?token=${res.token}`;
    await sendResetEmail(res.user.email, res.user.name, link);
  }

  // Luôn trả ok để không tiết lộ email có tồn tại hay không.
  return NextResponse.json({ ok: true });
}
