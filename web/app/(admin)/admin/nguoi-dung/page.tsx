import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/admin";
import { listUsers, toUserRow } from "@/lib/users";
import { UserManager } from "@/components/admin/UserManager";

export const metadata: Metadata = { title: "Người dùng — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [me, docs] = await Promise.all([getCurrentUser(), listUsers({ limit: 500 })]);
  const rows = docs.map(toUserRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Người dùng</h1>
        <p className="qp-admin-head__desc">Quản lý tài khoản: cấp/gỡ quyền admin, xác minh email, xoá tài khoản. Đổi quyền có hiệu lực ngay.</p>
      </div>
      <UserManager initial={rows} me={me!._id!.toString()} />
    </>
  );
}
