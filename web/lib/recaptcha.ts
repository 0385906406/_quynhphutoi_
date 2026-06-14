// Xác minh Google reCAPTCHA v3 phía server.
// Chưa cấu hình RECAPTCHA_SECRET_KEY → bỏ qua (trả true) để dev/local vẫn chạy.
// Ngưỡng điểm lấy từ Cài đặt admin (DB), mặc định từ env.
import { getSettings } from "@/lib/settings";

const SECRET = process.env.RECAPTCHA_SECRET_KEY || "";

export const recaptchaEnabled = !!SECRET;

export async function verifyRecaptcha(token: unknown, action?: string): Promise<boolean> {
  if (!SECRET) return true; // chưa bật → cho qua
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number; action?: string };
    const minScore = (await getSettings()).recaptchaMinScore;
    if (process.env.NODE_ENV !== "production") {
      console.log("[reCAPTCHA]", { success: data.success, score: data.score, action: data.action, expected: action, minScore });
    }
    if (!data.success) return false;
    if (typeof data.score === "number" && data.score < minScore) return false;
    if (action && data.action && data.action !== action) return false;
    return true;
  } catch {
    return false; // lỗi mạng tới Google → coi như không hợp lệ (fail-closed khi đã bật)
  }
}
