// API tin Tìm đồ rơi: liệt kê (GET) & đăng tin mới (POST — yêu cầu đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { checkPostQuota, recordPost } from "@/lib/post-quota";
import { getSettings } from "@/lib/settings";
import { isGoogleMapsUrl, resolveMapUrl } from "@/lib/map-embed";
import {
  createPost,
  listPosts,
  countPosts,
  type LostFoundKind,
  type LostFoundStatus,
} from "@/lib/lostfound";

const KINDS: LostFoundKind[] = ["tim-do", "nhat-duoc"];
const STATUSES: LostFoundStatus[] = ["open", "matched", "resolved", "closed"];

// GET /api/lost-found?kind=&category=&ward=&status=&search=&limit=&skip=
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind");
  const status = sp.get("status");

  const opts = {
    kind: kind && KINDS.includes(kind as LostFoundKind) ? (kind as LostFoundKind) : undefined,
    categorySlug: sp.get("category") || undefined,
    wardSlug: sp.get("ward") || undefined,
    status: status && STATUSES.includes(status as LostFoundStatus) ? (status as LostFoundStatus) : undefined,
    search: sp.get("search") || undefined,
    limit: Math.min(Number(sp.get("limit")) || 20, 100),
    skip: Math.min(Math.max(Number(sp.get("skip")) || 0, 0), 10000),
  };

  const [items, total] = await Promise.all([listPosts(opts), countPosts(opts)]);
  return NextResponse.json({ items, total });
}

// POST /api/lost-found — đăng tin mới (cần đăng nhập).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để đăng tin." }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings.lostfoundPostEnabled) return NextResponse.json({ error: "Tính năng đăng tin tìm đồ rơi đang tạm khoá." }, { status: 403 });

  const quota = await checkPostQuota(session.id);
  if (!quota.ok) return NextResponse.json({ error: quota.message }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  if (!(await verifyRecaptcha(b.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }
  const { kind, description, categoryId, images, location, occurredAt, contact, reward } = b;
  const title = stripHtml(String(b.title ?? "")).trim();

  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "Loại tin không hợp lệ (tim-do | nhat-duoc)." }, { status: 400 });
  }
  // Mô tả là HTML từ editor → làm sạch chống XSS, kiểm tra còn nội dung thật.
  const cleanDescription = sanitizeHtml(typeof description === "string" ? description : "");
  if (!title || !stripHtml(cleanDescription)) {
    return NextResponse.json({ error: "Vui lòng nhập tiêu đề và mô tả." }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "Vui lòng chọn danh mục." }, { status: 400 });
  }
  if (!location?.wardSlug) {
    return NextResponse.json({ error: "Vui lòng chọn địa điểm (xã/thị trấn)." }, { status: 400 });
  }
  if (!contact?.name?.trim() || !contact?.phone?.trim()) {
    return NextResponse.json({ error: "Vui lòng nhập tên và số điện thoại liên hệ." }, { status: 400 });
  }
  if (title.length > 160) {
    return NextResponse.json({ error: "Tiêu đề quá dài (tối đa 160 ký tự)." }, { status: 400 });
  }
  // Số điện thoại VN: 0 + 9 số, hoặc +84 + 9 số.
  const phoneClean = String(contact.phone).replace(/[\s.\-()]/g, "");
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(phoneClean)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
  }
  const over = (v: unknown, n: number) => typeof v === "string" && v.length > n;
  if (over(contact.name, 80) || over(contact.email, 120) || over(location.address, 200) || over(reward, 100)) {
    return NextResponse.json({ error: "Một số trường nhập quá dài, vui lòng rút gọn." }, { status: 400 });
  }
  // occurredAt: parse an toàn, không cho ngày rác / tương lai.
  let when = new Date();
  if (occurredAt) {
    const d = new Date(occurredAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Ngày không hợp lệ." }, { status: 400 });
    }
    if (d.getTime() > Date.now() + 86_400_000) {
      return NextResponse.json({ error: "Ngày không thể ở tương lai." }, { status: 400 });
    }
    when = d;
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

  try {
    const post = await createPost(
      { id: session.id, name: session.name },
      {
        kind,
        title,
        description: cleanDescription,
        categoryId,
        approved: !settings.postRequireApproval,
        images: Array.isArray(images) ? images.filter((x) => typeof x === "string").slice(0, settings.postMaxImages) : [],
        location: { wardSlug: location.wardSlug, address: location.address?.trim() || undefined, mapUrl },
        occurredAt: when,
        contact: {
          name: contact.name,
          phone: phoneClean,
          email: contact.email,
          hidePhone: !!contact.hidePhone,
        },
        reward: kind === "tim-do" ? reward : undefined,
      },
    );
    await recordPost(session.id);
    await notifyAdmins(
      { type: "post_pending", title: `Tin tìm đồ rơi mới chờ duyệt: “${post.title}”`, href: "/admin/tim-do-roi", actorName: session.name, module: "tim-do-roi" },
      session.id,
    );
    return NextResponse.json({ ok: true, slug: post.slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Đăng tin thất bại.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
