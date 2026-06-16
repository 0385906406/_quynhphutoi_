// Khu "Trang chủ" (cấu hình bố cục) đã gộp vào "Quản lý trang" → Trang chủ → tab Quản lý trang.
import { redirect } from "next/navigation";

export default function AdminHomeSectionsRedirect() {
  redirect("/admin/trang");
}
