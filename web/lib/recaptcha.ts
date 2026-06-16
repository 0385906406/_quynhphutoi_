// Xác minh Google reCAPTCHA v2 (ô tick "Tôi không phải robot") phía server.
// Chưa cấu hình RECAPTCHA_SECRET_KEY → bỏ qua (trả true) để dev/local vẫn chạy.
import { rateLimit, clientIp } from "@/lib/ratelimit";

const SECRET = process.env.RECAPTCHA_SECRET_KEY || "";

export const recaptchaEnabled = !!SECRET;

export async function verifyRecaptcha(token: unknown): Promise<boolean> {
  if (!SECRET) return true; // chưa bật → cho qua
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    if (process.env.NODE_ENV !== "production") {
      console.log("[reCAPTCHA v2]", { success: data.success });
    }
    return !!data.success;
  } catch {
    return false; // lỗi mạng tới Google → coi như không hợp lệ (fail-closed khi đã bật)
  }
}

// reCAPTCHA "thích nghi": chỉ thử thách khi nguồn (IP) gửi cùng một loại form vượt
// ngưỡng mềm trong cửa sổ thời gian → coi là khả nghi. Người dùng bình thường (gửi
// vài lần) KHÔNG bao giờ thấy ô tick; chỉ khi spam/bot mới bị yêu cầu xác minh.
//
// Dùng trong route:  const cap = await adaptiveRecaptcha(req, "contact", b.recaptchaToken);
//                    if (cap) return cap;   // 428 → client tự hiện ô tick, gửi lại
//
// Trả về null = cho qua (chưa khả nghi, đã tick hợp lệ, hoặc chưa cấu hình khóa).
export async function adaptiveRecaptcha(
  req: Request,
  action: string,
  token: unknown,
  opts: { softMax?: number; windowSec?: number } = {},
): Promise<Response | null> {
  if (!recaptchaEnabled) return null; // chưa cấu hình khóa → không có gì để thử thách
  const ip = clientIp(req);
  const rl = await rateLimit(`captcha:${action}:ip:${ip}`, opts.softMax ?? 5, opts.windowSec ?? 600);
  if (rl.ok) return null;                          // chưa vượt ngưỡng → bỏ qua reCAPTCHA
  if (await verifyRecaptcha(token)) return null;   // đã khả nghi nhưng tick hợp lệ → cho qua
  return Response.json(
    { error: "Vui lòng xác nhận “Tôi không phải robot” để tiếp tục.", recaptchaRequired: true },
    { status: 428 },
  );
}
