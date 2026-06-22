import type { Metadata } from "next";
import { getRolePermissions, PERM_MODULES, ADMIN_PERMS } from "@/lib/role-permissions";
import { listCustomRoles } from "@/lib/custom-roles";
import { requireAdminPage } from "@/lib/admin";
import { RolePermissionsManager } from "@/components/admin/RolePermissionsManager";
import { CustomRoleManager } from "@/components/admin/CustomRoleManager";

export const metadata: Metadata = { title: "Phân quyền — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RolePermissionsPage() {
  await requireAdminPage();
  const [config, customRoles] = await Promise.all([getRolePermissions(), listCustomRoles()]);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Phân quyền</h1>
        <p className="qp-admin-head__desc">Cấu hình quyền truy cập từng module cho từng vai trò. Admin luôn có toàn quyền và không thể chỉnh sửa.</p>
      </div>
      <RolePermissionsManager
        initialConfig={config}
        modules={PERM_MODULES as unknown as { key: string; label: string; group: string }[]}
        adminPerms={ADMIN_PERMS as Record<string, string>}
      />
      <CustomRoleManager
        initial={customRoles}
        modules={PERM_MODULES as unknown as { key: string; label: string; group: string }[]}
      />
    </>
  );
}
