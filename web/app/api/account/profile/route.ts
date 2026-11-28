import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { findById, updateUserProfile } from "@/lib/users";
import { adaptiveRecaptcha } from "@/lib/recaptcha";
import { GENDERS, OCCUPATIONS, INTEREST_KEYS, type UserProfile } from "@/lib/profile-options";
import { WARDS } from "@/lib/wards";

// Làm sạch hồ sơ do client gửi: chỉ nhận giá trị nằm trong danh sách cho phép, mọi trường đều tuỳ chọn.
function cleanProfile(raw: unknown): UserProfile | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const gender = GENDERS.some((g) => g.value === r.gender) ? (r.gender as UserProfile["gender"]) : "";
  const y = typeof r.birthYear === "number" ? Math.trunc(r.birthYear) : null;
  const thisYear = new Date().getFullYear();
  const birthYear = y && y >= thisYear - 110 && y <= thisYear - 5 ? y : null;
  const wardSlug = typeof r.wardSlug === "string" && WARDS.some((w) => w.slug === r.wardSlug) ? r.wardSlug : "";
  const occupation = (OCCUPATIONS as readonly string[]).includes(r.occupation as string) ? (r.occupation as UserProfile["occupation"]) : "";
  const interests = Array.isArray(r.interests) ? [...new Set(r.interests.filter((x): x is string => typeof x === "string" && INTEREST_KEYS.includes(x)))].slice(0, 10) : [];
  return { gender, birthYear, wardSlug, occupation, interests, personalize: r.personalize !== false };
}

// Cập nhật thông tin tài khoản: tên hiển thị + ảnh đại diện + hồ sơ cá nhân tuỳ chọn.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, avatar } = body;

  const cap = await adaptiveRecaptcha(req, "profile", body.recaptchaToken);
  if (cap) return cap;

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2) return NextResponse.json({ error: "Tên hiển thị phải có ít nhất 2 ký tự." }, { status: 400 });
  if (trimmed.length > 60) return NextResponse.json({ error: "Tên hiển thị quá dài (tối đa 60 ký tự)." }, { status: 400 });

  // avatar: chuỗi URL (https… hoặc /uploads/…); "" = xoá ảnh. Bỏ qua giá trị lạ.
  let avatarVal: string | null | undefined;
  if (typeof avatar === "string") {
    const a = avatar.trim();
    if (a && !/^(https?:\/\/|\/)/i.test(a)) {
      return NextResponse.json({ error: "Đường dẫn ảnh không hợp lệ." }, { status: 400 });
    }
    avatarVal = a.slice(0, 500); // "" → xoá; có giá trị → lưu
  }

  const u = await findById(session.id);
  if (!u) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });

  const updated = await updateUserProfile(session.id, { name: trimmed, avatar: avatarVal, profile: cleanProfile(body.profile) });
  // Cập nhật lại phiên để tên + ảnh mới hiển thị ngay trên thanh tài khoản.
  await createSession({ id: String(u._id), email: u.email, name: trimmed, avatar: updated?.avatar || "" });
  return NextResponse.json({ ok: true, name: trimmed, avatar: updated?.avatar || "" });
}
