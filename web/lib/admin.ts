// Tiện ích quyền admin — đọc phiên đăng nhập rồi tra user trong DB để biết role.
// Tra DB mỗi lần (không nhét role vào JWT) → đổi quyền có hiệu lực ngay, không cần
// đăng nhập lại.
import { getSession } from "@/lib/auth";
import { findById, isAdmin, type UserDoc } from "@/lib/users";

// User đầy đủ của phiên hiện tại (gồm role), hoặc null nếu chưa đăng nhập.
export async function getCurrentUser(): Promise<UserDoc | null> {
  const session = await getSession();
  if (!session?.id) return null;
  return findById(session.id);
}

// true nếu phiên hiện tại là admin.
export async function isCurrentUserAdmin(): Promise<boolean> {
  return isAdmin(await getCurrentUser());
}
