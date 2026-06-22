import type { Metadata } from "next";
import { getCurrentUser, requireAdminPage } from "@/lib/admin";
import { listUsers, toUserRow } from "@/lib/users";
import { listCustomRoles } from "@/lib/custom-roles";
import { UserManager } from "@/components/admin/UserManager";

const SUPERADMIN_EMAIL = "duongnv10504@gmail.com";

export const metadata: Metadata = { title: "Người dùng — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdminPage();
  const [me, docs, customRoles] = await Promise.all([getCurrentUser(), listUsers({ limit: 500 }), listCustomRoles()]);
  const rows = docs.map(toUserRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Người dùng</h1>
        <p className="qp-admin-head__desc">Quản lý tài khoản &amp; vai trò: <b>Admin</b> toàn quyền · <b>Biên tập viên</b> chỉ làm nội dung và kiểm duyệt · <b>Người dùng</b> thường. Đổi quyền có hiệu lực ngay.</p>
      </div>
      <UserManager initial={rows} me={me!._id!.toString()} isSuperAdmin={me!.email === SUPERADMIN_EMAIL} customRoles={customRoles} />
    </>
  );
}
