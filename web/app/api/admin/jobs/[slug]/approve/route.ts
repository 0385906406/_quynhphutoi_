// Admin duyệt / bỏ duyệt 1 tin việc làm.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin } from "@/lib/users";
import { approveJob, getJobBySlug } from "@/lib/jobs";
import { notifyUser } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Chỉ admin mới được duyệt tin." }, { status: 403 });
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const approved = body.approved !== false;
  await approveJob(slug, approved);
  if (approved) {
    await notifyUser(job.postedBy, { type: "post_approved", title: `Tin tuyển dụng “${job.title}” của bạn đã được duyệt`, href: `/viec-lam/${slug}`, module: "viec-lam" });
  }
  return NextResponse.json({ ok: true, approved });
}
