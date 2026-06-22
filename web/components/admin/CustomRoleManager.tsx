"use client";

import React, { useMemo, useState } from "react";
import type { CustomRoleRow } from "@/lib/custom-roles";
import type { PermLevel, RolePerms } from "@/lib/role-permissions";
import { useToast } from "@/components/common/Toast";

type ModuleDef = { key: string; label: string; group: string };

const LEVELS: { value: PermLevel; label: string; desc: string }[] = [
  { value: "none", label: "Không",      desc: "Ẩn & chặn truy cập" },
  { value: "view", label: "Xem",             desc: "Chỉ xem danh sách" },
  { value: "edit", label: "Sửa",         desc: "Thêm + sửa, không xóa" },
  { value: "full", label: "Toàn quyền", desc: "Xem + thêm + sửa + xóa + duyệt" },
];

const LEVEL_BG: Record<PermLevel, string> = {
  none: "#94A3B8",
  view: "var(--color-indigo)",
  edit: "var(--color-teal-dark)",
  full: "var(--color-teal)",
};

const GROUP_ACCENT: Record<string, string> = {
  "Nội dung":    "var(--color-teal)",
  "Kiểm duyệt": "var(--color-warning)",
  "Dữ liệu":    "var(--color-indigo)",
  "Hệ thống":   "var(--color-navy)",
};

function buildDefaultPerms(mods: ModuleDef[]): RolePerms {
  return Object.fromEntries(mods.map((m) => [m.key, "none"])) as RolePerms;
}

function PillSelector({ name, level, onChange }: { name: string; level: PermLevel; onChange: (v: PermLevel) => void }) {
  return (
    <div className="qp-perm-pills" role="group" aria-label={name}>
      {LEVELS.map((lv) => (
        <button
          key={lv.value}
          type="button"
          className={`qp-perm-pill qp-perm-pill--${lv.value}${level === lv.value ? " is-active" : ""}`}
          onClick={() => onChange(lv.value)}
          aria-pressed={level === lv.value}
          title={lv.desc}
        >
          {lv.label}
        </button>
      ))}
    </div>
  );
}

type FormState = { mode: "create" | "edit"; id?: string; label: string; perms: RolePerms };

export function CustomRoleManager({ initial, modules }: { initial: CustomRoleRow[]; modules: ModuleDef[] }) {
  const [roles, setRoles] = useState<CustomRoleRow[]>(initial);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const groups = useMemo(() => {
    const map = new Map<string, ModuleDef[]>();
    for (const m of modules) {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group)!.push(m);
    }
    return [...map.entries()];
  }, [modules]);

  function startCreate() {
    setForm({ mode: "create", label: "", perms: buildDefaultPerms(modules) });
  }

  function startEdit(role: CustomRoleRow) {
    setForm({ mode: "edit", id: role.id, label: role.label, perms: { ...buildDefaultPerms(modules), ...role.perms } });
  }

  function setFormPerm(key: string, level: PermLevel) {
    setForm((f) => f ? { ...f, perms: { ...f.perms, [key]: level } } : f);
  }

  async function save() {
    if (!form) return;
    const label = form.label.trim();
    if (!label) { toast.error("Vui lòng nhập tên vai trò."); return; }

    setBusy(true);
    try {
      if (form.mode === "create") {
        const res = await fetch("/api/admin/custom-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, perms: form.perms }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { toast.error(d.error || "Tạo thất bại."); return; }
        setRoles((prev) => [...prev, d.role].sort((a, b) => a.label.localeCompare(b.label)));
        toast.success(`Đã tạo vai trò "${label}".`);
        setForm(null);
      } else {
        const res = await fetch(`/api/admin/custom-roles/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, perms: form.perms }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { toast.error(d.error || "Lưu thất bại."); return; }
        setRoles((prev) =>
          prev.map((r) => r.id === form.id ? { ...r, label, perms: form.perms } : r)
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        toast.success(`Đã cập nhật vai trò "${label}".`);
        setForm(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole(role: CustomRoleRow) {
    if (!confirm(`Xóa vai trò "${role.label}"?\nTất cả người dùng đang dùng vai trò này sẽ được reset về "Người dùng".`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/custom-roles/${role.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d.error || "Xóa thất bại."); return; }
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      if (form?.id === role.id) setForm(null);
      toast.success(`Đã xóa vai trò "${role.label}".`);
    } finally {
      setBusy(false);
    }
  }

  const isEditing = (id: string) => form?.mode === "edit" && form.id === id;

  return (
    <div className="qp-perm-wrap" style={{ marginTop: "var(--space-10, 40px)" }}>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5, 20px)" }}>
        <div>
          <h2 className="type-h2" style={{ margin: 0 }}>Vai trò tùy chỉnh</h2>
          <p className="type-body-small text-muted" style={{ marginTop: 4 }}>
            Tạo vai trò riêng với quyền tùy chỉnh và gán cho nhiều người dùng.
          </p>
        </div>
        {!form && (
          <button type="button" className="qp-btn-primary" style={{ flexShrink: 0 }} onClick={startCreate}>
            + Tạo vai trò mới
          </button>
        )}
      </div>

      {/* Empty state */}
      {roles.length === 0 && !form && (
        <div className="qp-empty" style={{ padding: "var(--space-8, 32px)" }}>
          <div className="qp-empty__title">Chưa có vai trò tùy chỉnh nào</div>
          <div className="qp-empty__sub">Tạo vai trò mới để phân quyền linh hoạt hơn cho người dùng cụ thể.</div>
        </div>
      )}

      {/* List of existing roles */}
      {roles.map((role) => (
        <div
          key={role.id}
          className="qp-perm-card"
          style={{ "--perm-accent": "var(--color-indigo)" } as React.CSSProperties}
        >
          <div className="qp-perm-card__head" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="qp-perm-card__name" style={{ flex: 1 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "var(--color-indigo)", color: "#fff",
                fontSize: 12, fontWeight: 700, borderRadius: 4, padding: "3px 9px",
                letterSpacing: ".3px",
              }}>
                {role.label}
              </span>
            </span>
            {/* Permission summary */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["full", "edit", "view", "none"] as PermLevel[]).map((lv) => {
                const count = Object.values(role.perms).filter((v) => v === lv).length;
                if (!count) return null;
                return (
                  <span key={lv} style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 6px", background: LEVEL_BG[lv], color: "#fff" }}>
                    {LEVELS.find((l) => l.value === lv)?.label} {count}
                  </span>
                );
              })}
            </div>
            {!isEditing(role.id) && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  className="qp-btn-outline"
                  style={{ padding: "4px 12px", fontSize: 13 }}
                  onClick={() => startEdit(role)}
                  disabled={busy}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="qp-btn-outline"
                  style={{ padding: "4px 12px", fontSize: 13, borderColor: "var(--color-error)", color: "var(--color-error)" }}
                  onClick={() => deleteRole(role)}
                  disabled={busy}
                >
                  Xóa
                </button>
              </div>
            )}
            {isEditing(role.id) && (
              <span className="type-body-small text-muted" style={{ flexShrink: 0 }}>Đang chỉnh sửa</span>
            )}
          </div>
        </div>
      ))}

      {/* Create / Edit form */}
      {form && (
        <div className="qp-perm-card" style={{ "--perm-accent": "var(--color-indigo)", marginTop: "var(--space-4, 16px)" } as React.CSSProperties}>
          <div className="qp-perm-card__head">
            <span className="qp-perm-card__name">{form.mode === "create" ? "Tạo vai trò mới" : `Chỉnh sửa: ${roles.find((r) => r.id === form.id)?.label}`}</span>
          </div>

          {/* Label input */}
          <div style={{ padding: "var(--space-4, 16px) var(--space-5, 20px)", borderBottom: "1px solid var(--color-gray-border)" }}>
            <label className="type-body-small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
              Tên vai trò
            </label>
            <input
              className="qp-input"
              style={{ maxWidth: 360 }}
              value={form.label}
              onChange={(e) => setForm((f) => f ? { ...f, label: e.target.value } : f)}
              placeholder="VD: Phóng viên, Cộng tác viên…"
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Permission matrix */}
          <div style={{ padding: "var(--space-4, 16px) var(--space-5, 20px)" }}>
            <div className="type-body-small" style={{ fontWeight: 600, marginBottom: "var(--space-3, 12px)" }}>Phân quyền theo module</div>
            <div className="qp-perm-groups">
              {groups.map(([group, mods]) => (
                <div
                  key={group}
                  className="qp-perm-card"
                  style={{ "--perm-accent": GROUP_ACCENT[group] ?? "var(--color-teal)" } as React.CSSProperties}
                >
                  <div className="qp-perm-card__head">
                    <span className="qp-perm-card__name">{group}</span>
                    <span className="qp-perm-card__count">{mods.length}</span>
                  </div>
                  {mods.map((m) => {
                    const level = (form.perms[m.key as keyof RolePerms] ?? "none") as PermLevel;
                    return (
                      <div key={m.key} className="qp-perm-row">
                        <div className="qp-perm-row__module">{m.label}</div>
                        {/* span both admin + editor columns so PillSelector gets full width */}
                        <div style={{ gridColumn: "2 / -1", display: "flex", alignItems: "center" }}>
                          <PillSelector name={m.key} level={level} onChange={(v) => setFormPerm(m.key, v)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Form footer */}
          <div className="qp-perm-footer">
            <p className="type-body-small text-muted">
              Thay đổi quyền có hiệu lực ngay sau khi lưu.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="qp-btn-outline" onClick={() => setForm(null)} disabled={busy}>
                Huỷ
              </button>
              <button type="button" className="qp-btn-primary" onClick={save} disabled={busy}>
                {busy ? "Đang lưu…" : form.mode === "create" ? "Tạo vai trò" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
