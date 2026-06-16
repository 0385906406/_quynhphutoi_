// Tiện ích quyền admin — đọc phiên đăng nhập rồi tra user trong DB để biết role.
// Tra DB mỗi lần (không nhét role vào JWT) → đổi quyền có hiệu lực ngay, không cần
// đăng nhập lại.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { findById, isAdmin, isStaff, type UserDoc } from "@/lib/users";

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

// true nếu phiên hiện tại là nhân sự khu quản trị (admin hoặc editor).
export async function isCurrentUserStaff(): Promise<boolean> {
  return isStaff(await getCurrentUser());
}

// Guard cho PAGE chỉ-admin trong khu /admin: editor (hoặc khách) bị đẩy về dashboard.
// Layout (admin) đã chặn người ngoài; helper này chặn editor gõ URL hệ thống trực tiếp.
export async function requireAdminPage(): Promise<void> {
  if (!isAdmin(await getCurrentUser())) redirect("/admin");
}
