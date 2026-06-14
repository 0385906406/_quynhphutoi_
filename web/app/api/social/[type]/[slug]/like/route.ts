// Bật/tắt thích 1 mục bất kỳ (cần đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isSocialType, toggleSocialLike, socialTargetExists } from "@/lib/social";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";

export async function POST(_req: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập để thích." }, { status: 401 });

  if (!(await getSettings()).likesEnabled) return NextResponse.json({ error: "Tính năng thích đang tạm khoá." }, { status: 403 });

  const rl = await rateLimit(`like:${session.id}`, 40, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn thao tác quá nhanh.");

  const { type, slug } = await params;
  if (!isSocialType(type)) return NextResponse.json({ error: "Không hợp lệ." }, { status: 400 });
  if (!(await socialTargetExists(type, slug))) return NextResponse.json({ error: "Không tìm thấy mục này." }, { status: 404 });

  const result = await toggleSocialLike(type, slug, session.id);
  return NextResponse.json(result);
}
