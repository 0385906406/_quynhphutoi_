// Admin: cây danh mục theo module (GET ?module=) & tạo danh mục (POST).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getTree, createCategory, listModules, type CategoryNode } from "@/lib/categories";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/activity-log";

// Cây phẳng-an-toàn cho client (ObjectId/Date → string).
export type CatNode = {
  id: string; module: string; slug: string; name: string; parentId: string | null;
  depth: number; order: number; icon: string; href: string; description: string; active: boolean;
  children: CatNode[];
};
export function serializeTree(nodes: CategoryNode[]): CatNode[] {
  return nodes.map((n) => ({
    id: n._id!.toString(), module: n.module, slug: n.slug, name: n.name,
    parentId: n.parentId ? n.parentId.toString() : null, depth: n.depth, order: n.order,
    icon: n.icon ?? "", href: n.href ?? "", description: n.description ?? "", active: n.active,
    children: serializeTree(n.children),
  }));
}

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const url = new URL(req.url);
  const module = url.searchParams.get("module") || "";
  const modules = await listModules();
  const tree = module ? serializeTree(await getTree(module)) : [];
  return NextResponse.json({ modules, tree });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));

  const module = String(b.module || "").trim();
  const name = String(b.name || "").trim();
  if (!module) return NextResponse.json({ error: "Thiếu module (phân hệ)." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Nhập tên danh mục." }, { status: 400 });
  const slug = String(b.slug || "").trim() || slugify(name);

  try {
    const created = await createCategory({
      module, slug, name,
      parentId: b.parentId || null,
      order: b.order != null ? Number(b.order) : 0,
      icon: b.icon || undefined, href: b.href || undefined, description: b.description || undefined,
      active: b.active !== false,
    });
      void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "category.create", target: { type: "danh-muc", label: name }, success: true });
    return NextResponse.json({ ok: true, id: created._id!.toString() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không tạo được danh mục." }, { status: 400 });
  }
}
