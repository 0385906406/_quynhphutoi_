// Nhận liên hệ / phản ánh từ form công khai → lưu DB + báo admin. Có rate-limit theo IP.
import { NextResponse } from "next/server";
import { createContact } from "@/lib/contact";
import { notifyAdmins } from "@/lib/notifications";
import { stripHtml } from "@/lib/sanitize";
import { rateLimit, tooMany, clientIp } from "@/lib/ratelimit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit(`contact:ip:${ip}`, 5, 3600); // 5 lần / giờ / IP
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn gửi liên hệ quá nhiều lần. Vui lòng thử lại sau.");

  const b = await req.json().catch(() => ({}));
  if (!(await verifyRecaptcha(b.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }
  const name = stripHtml(String(b.name ?? "")).trim();
  const email = String(b.email ?? "").trim();
  const message = stripHtml(String(b.message ?? "")).trim();
  const phone = stripHtml(String(b.phone ?? "")).trim();
  const type = String(b.type ?? "Khác");

  if (!name || name.length > 120) return NextResponse.json({ error: "Vui lòng nhập họ tên hợp lệ." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  if (!message || message.length > 2000) return NextResponse.json({ error: "Nội dung không hợp lệ (tối đa 2000 ký tự)." }, { status: 400 });

  await createContact({ name, email, phone, type, message });
  await notifyAdmins({ type: "announcement", title: `Liên hệ mới (${type}) từ ${name}`, href: "/admin/lien-he", module: "lien-he" });

  return NextResponse.json({ ok: true });
}
