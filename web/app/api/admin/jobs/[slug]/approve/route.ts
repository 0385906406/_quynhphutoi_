// Admin duyệt / bỏ duyệt 1 tin việc làm.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { approveJob, getJobBySlug } from "@/lib/jobs";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requirePerm("viec-lam", "edit");
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const approved = body.approved !== false;
  await approveJob(slug, approved, approved ? { id: g.user._id!.toString(), name: g.user.name } : undefined);
  if (approved) {
    await notifyUser(job.postedBy, { type: "post_approved", title: `Tin tuyển dụng "${job.title}" của bạn đã được duyệt`, href: `/viec-lam/${slug}`, module: "viec-lam" });
  }
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: approved ? "job.approve" : "job.reject", target: { type: "việc làm", id: slug, label: job.title }, success: true });
  return NextResponse.json({ ok: true, approved });
}
