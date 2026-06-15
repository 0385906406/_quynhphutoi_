// API Việc làm: liệt kê (GET) & đăng tin tuyển dụng (POST — cần đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";
import { sanitizeHtml } from "@/lib/sanitize";
import { stripHtml } from "@/lib/strip-html";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { checkPostQuota, recordPost } from "@/lib/post-quota";
import { getSettings } from "@/lib/settings";
import { scanProfanity, getActiveProfanityWords } from "@/lib/profanity";
import { isGoogleMapsUrl, resolveMapUrl } from "@/lib/map-embed";
import { createJob, listJobs, countJobs, type JobType, type JobStatus } from "@/lib/jobs";

const JOB_TYPES: JobType[] = ["toan-thoi-gian", "ban-thoi-gian", "thoi-vu", "thuc-tap"];
const STATUSES: JobStatus[] = ["open", "closed", "filled"];

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const jt = sp.get("jobType");
  const status = sp.get("status");
  const opts = {
    industry: sp.get("industry") || undefined,
    jobType: jt && JOB_TYPES.includes(jt as JobType) ? (jt as JobType) : undefined,
    wardSlug: sp.get("ward") || undefined,
    status: status && STATUSES.includes(status as JobStatus) ? (status as JobStatus) : undefined,
    search: sp.get("search") || undefined,
    limit: Math.min(Number(sp.get("limit")) || 24, 100),
    skip: Math.min(Math.max(Number(sp.get("skip")) || 0, 0), 10000),
  };
  const [items, total] = await Promise.all([listJobs(opts), countJobs(opts)]);
  return NextResponse.json({ items, total });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập để đăng tin." }, { status: 401 });

  const settings = await getSettings();
  if (!settings.jobsPostEnabled) return NextResponse.json({ error: "Tính năng đăng tin việc làm đang tạm khoá." }, { status: 403 });

  const quota = await checkPostQuota(session.id);
  if (!quota.ok) return NextResponse.json({ error: quota.message }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  if (!(await verifyRecaptcha(b.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }
  const { company, industry, jobType, description, images, salary, location, quantity, experience, education, deadline, contact } = b;
  const title = stripHtml(String(b.title ?? "")).trim();
  const companyClean = stripHtml(String(company ?? "")).trim();

  if (!title || !companyClean) {
    return NextResponse.json({ error: "Vui lòng nhập vị trí tuyển dụng và tên nhà tuyển dụng." }, { status: 400 });
  }
  if (title.length > 160 || companyClean.length > 120) {
    return NextResponse.json({ error: "Tiêu đề / tên nhà tuyển dụng quá dài." }, { status: 400 });
  }
  if (!industry) return NextResponse.json({ error: "Vui lòng chọn ngành nghề." }, { status: 400 });
  if (!JOB_TYPES.includes(jobType)) return NextResponse.json({ error: "Loại hình công việc không hợp lệ." }, { status: 400 });

  const cleanDescription = sanitizeHtml(typeof description === "string" ? description : "");
  if (!stripHtml(cleanDescription)) {
    return NextResponse.json({ error: "Vui lòng nhập mô tả công việc." }, { status: 400 });
  }
  if (!location?.wardSlug) {
    return NextResponse.json({ error: "Vui lòng chọn địa điểm làm việc." }, { status: 400 });
  }
  if (!contact?.name?.trim() || !contact?.phone?.trim()) {
    return NextResponse.json({ error: "Vui lòng nhập tên và số điện thoại liên hệ." }, { status: 400 });
  }
  const phoneClean = String(contact.phone).replace(/[\s.\-()]/g, "");
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(phoneClean)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
  }
  // Giới hạn độ dài các trường tự do (chống nhồi dữ liệu).
  const over = (v: unknown, n: number) => typeof v === "string" && v.length > n;
  if (over(contact.name, 80) || over(contact.email, 120) || over(location.address, 200) || over(experience, 100) || over(education, 100)) {
    return NextResponse.json({ error: "Một số trường nhập quá dài, vui lòng rút gọn." }, { status: 400 });
  }

  // Lương (triệu) — số không âm; min ≤ max.
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
  const sMin = num(salary?.min), sMax = num(salary?.max);
  if (sMin && sMax && sMin > sMax) {
    return NextResponse.json({ error: "Lương tối thiểu không được lớn hơn tối đa." }, { status: 400 });
  }

  let dl: Date | null = null;
  if (deadline) {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Hạn nộp không hợp lệ." }, { status: 400 });
    dl = d;
  }

  // Link Google Maps (tuỳ chọn): validate + resolve link rút gọn → lưu link đầy đủ có toạ độ.
  let mapUrl: string | undefined;
  const rawMap = typeof location.mapUrl === "string" ? location.mapUrl.trim() : "";
  if (rawMap) {
    if (rawMap.length > 500 || !isGoogleMapsUrl(rawMap)) {
      return NextResponse.json({ error: "Link Google Maps không hợp lệ." }, { status: 400 });
    }
    mapUrl = await resolveMapUrl(rawMap);
  }

  // Lọc từ ngữ thô tục: nếu phát hiện → KHÔNG tự động duyệt, giữ chờ admin xem.
  const badWords = settings.profanityFilterEnabled
    ? scanProfanity(`${title}\n${companyClean}\n${stripHtml(cleanDescription)}`, await getActiveProfanityWords())
    : [];
  const approved = !settings.postRequireApproval && badWords.length === 0;

  try {
    const job = await createJob(
      { id: session.id, name: session.name },
      {
        title, company: companyClean, industry, jobType,
        description: cleanDescription,
        approved,
        images: Array.isArray(images) ? images.filter((x) => typeof x === "string").slice(0, settings.postMaxImages) : [],
        salary: { min: sMin, max: sMax, negotiable: !!salary?.negotiable || (!sMin && !sMax) },
        location: { wardSlug: location.wardSlug, address: location.address?.trim() || undefined, mapUrl },
        quantity: num(quantity),
        experience: experience?.trim() || undefined,
        education: education?.trim() || undefined,
        deadline: dl,
        contact: { name: contact.name.trim(), phone: phoneClean, email: contact.email?.trim() || undefined, hidePhone: !!contact.hidePhone },
      },
    );
    await recordPost(session.id);
    await notifyAdmins(
      {
        type: "post_pending",
        title: badWords.length
          ? `⚠️ Tin việc làm có từ ngữ nhạy cảm, cần xem: “${job.title}”`
          : `Tin việc làm mới chờ duyệt: “${job.title}”`,
        href: "/admin/viec-lam", actorName: session.name, module: "viec-lam",
      },
      session.id,
    );
    return NextResponse.json({ ok: true, slug: job.slug, approved });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Đăng tin thất bại." }, { status: 400 });
  }
}
