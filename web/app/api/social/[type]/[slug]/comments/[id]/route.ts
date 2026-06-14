// Xoá 1 bình luận — tác giả hoặc admin.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin } from "@/lib/users";
import { deleteSocialComment } from "@/lib/social";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ type: string; slug: string; id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const rl = await rateLimit(`cmtdel:${user._id!.toString()}`, 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Thao tác quá nhanh.");

  const { id } = await params;
  const deleted = await deleteSocialComment(id, user._id!.toString(), isAdmin(user));
  if (!deleted) return NextResponse.json({ error: "Không xoá được (không phải bình luận của bạn)." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
