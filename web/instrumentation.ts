// Hook chạy MỘT lần khi server Next khởi động (không chạy lúc build).
// Dùng để tự tạo tài khoản admin từ biến môi trường (xem lib/bootstrap-admin).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapAdmin } = await import("@/lib/bootstrap-admin");
    await bootstrapAdmin();
  }
}
