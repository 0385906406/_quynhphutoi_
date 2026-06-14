// Tự tạo tài khoản admin khi server KHỞI ĐỘNG (gọi từ instrumentation.ts).
// Lấy thông tin từ biến môi trường — KHÔNG hardcode mật khẩu trong code:
//   ADMIN_EMAIL, ADMIN_PASSWORD (bắt buộc để chạy), ADMIN_NAME (tuỳ chọn).
// Bỏ qua nếu thiếu email/mật khẩu. Idempotent: tạo mới nếu chưa có, nâng quyền nếu đã có.
// Chạy lúc start (không phải lúc build) nên an toàn với mọi cách deploy.
import { ensureAdmin } from "@/lib/users";

let _done = false;

export async function bootstrapAdmin(): Promise<void> {
  if (_done) return;
  _done = true;

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Quản trị viên";

  if (!email || !password) {
    console.log("[bootstrap-admin] Bỏ qua — chưa đặt ADMIN_EMAIL / ADMIN_PASSWORD.");
    return;
  }
  try {
    const result = await ensureAdmin(email, name, password);
    console.log(`[bootstrap-admin] ${email}: ${result}.`);
  } catch (e) {
    // Không làm sập server nếu DB chưa sẵn sàng — chỉ log.
    console.error("[bootstrap-admin] Lỗi tạo admin:", (e as Error)?.message ?? e);
  }
}
