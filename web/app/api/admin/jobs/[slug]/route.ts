// Admin sửa nội dung / từ chối / xoá hẳn 1 tin việc làm.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { deleteJob, getJobBySlug, updateJob, type JobPatch, type JobStatus } from "@/lib/jobs";
import { notifyUser } from "@/lib/notifications";
import { sanitizeHtml } from "@/lib/sanitize";
import { sanitizeSeoFields } from "@/lib/seo-fields";
import { isGoogleMapsUrl, resolveMapUrl } from "@/lib/map-embed";
import { logActivity } from "@/lib/activity-log";

const JOB_STATUSES: JobStatus[] = ["open", "closed", "filled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requirePerm("viec-lam", "edit");
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const b = await req.json().catch(() => ({}));

  const patch: JobPatch = {};
  if (typeof b.title === "string") patch.title = b.title;
  if (typeof b.company === "string") patch.company = b.company;
  if (typeof b.description === "string") patch.description = sanitizeHtml(b.description);
  if (typeof b.featured === "boolean") patch.featured = b.featured;
  if (typeof b.approved === "boolean") patch.approved = b.approved;
  if (b.status !== undefined && JOB_STATUSES.includes(b.status)) patch.status = b.status;
  if (Array.isArray(b.images)) patch.images = b.images.filter((x: unknown) => typeof x === "string").slice(0, 12);
  if (typeof b.address === "string") patch["location.address"] = b.address.trim();
  if (typeof b.mapUrl === "string") {
    const raw = b.mapUrl.trim();
    if (raw && (raw.length > 500 || !isGoogleMapsUrl(raw))) {
      return NextResponse.json({ error: "Link Google Maps không hợp lệ." }, { status: 400 });
    }
    patch["location.mapUrl"] = raw ? await resolveMapUrl(raw) : "";
  }
  if ("seo" in b) patch.seo = sanitizeSeoFields(b.seo);

  const n = await updateJob(slug, patch);
  if (!n) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "job.update", target: { type: "viec-lam", id: slug }, success: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requirePerm("viec-lam", "edit");
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  const deleted = await deleteJob(slug);
  if (!deleted) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  if (job) {
    await notifyUser(job.postedBy, { type: "post_rejected", title: `Tin tuyển dụng "${job.title}" của bạn không được duyệt`, href: "/tai-khoan/bai-dang", module: "viec-lam" });
  }
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "job.delete", target: { type: "viec-lam", id: slug }, success: true });
  return NextResponse.json({ ok: true });
}
