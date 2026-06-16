// Xoá 1 bình luận — tác giả hoặc admin.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isStaff } from "@/lib/users";
import { deleteComment } from "@/lib/lostfound-social";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const rl = await rateLimit(`cmtdel:${user._id!.toString()}`, 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Thao tác quá nhanh.");

  const { id } = await params;
  const deleted = await deleteComment(id, user._id!.toString(), isStaff(user));
  if (!deleted) return NextResponse.json({ error: "Không xoá được (không phải bình luận của bạn)." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
