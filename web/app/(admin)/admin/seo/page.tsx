// Khu "SEO từng trang" đã gộp vào "Quản lý trang" (tab SEO). Giữ route cũ → chuyển hướng.
import { redirect } from "next/navigation";

export default function AdminSeoRedirect() {
  redirect("/admin/trang");
}
