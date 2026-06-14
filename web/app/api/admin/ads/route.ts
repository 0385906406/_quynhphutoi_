// Admin: liệt kê (GET) & tạo (POST) quảng cáo.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin } from "@/lib/users";
import { listAllAds, createAd, isPlacement, type AdPlacement } from "@/lib/ads";
import { isGoogleMapsUrl, resolveMapUrl } from "@/lib/map-embed";

async function guard() {
  const user = await getCurrentUser();
  if (!user) return { error: "Vui lòng đăng nhập.", status: 401 as const };
  if (!isAdmin(user)) return { error: "Chỉ admin.", status: 403 as const };
  return null;
}

export async function GET() {
  const g = await guard();
  if (g) return NextResponse.json({ error: g.error }, { status: g.status });
  const rows = await listAllAds();
  return NextResponse.json({
    ads: rows.map((a) => ({
      id: a._id!.toString(), advertiser: a.advertiser, title: a.title, description: a.description ?? "",
      imageDesktop: a.imageDesktop, imageMobile: a.imageMobile ?? null,
      linkUrl: a.linkUrl, phone: a.phone ?? "", address: a.address ?? "", mapUrl: a.mapUrl ?? "",
      placement: a.placement, weight: a.weight,
      startDate: a.startDate ? a.startDate.toISOString().slice(0, 10) : null,
      endDate: a.endDate ? a.endDate.toISOString().slice(0, 10) : null,
      active: a.active, impressions: a.impressions, clicks: a.clicks,
    })),
  });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return NextResponse.json({ error: g.error }, { status: g.status });

  const b = await req.json().catch(() => ({}));
  const advertiser = String(b.advertiser || "").trim();
  const title = String(b.title || "").trim();
  const description = String(b.description || "").trim();
  const imageDesktop = String(b.imageDesktop || "").trim();
  const linkUrl = String(b.linkUrl || "").trim();
  const phone = String(b.phone || "").trim();
  const address = String(b.address || "").trim();
  const placement = String(b.placement || "");
  if (!advertiser || !title) return NextResponse.json({ error: "Nhập tên nhãn hàng và tiêu đề." }, { status: 400 });
  if (!imageDesktop) return NextResponse.json({ error: "Cần ảnh quảng cáo." }, { status: 400 });
  // Link đích TUỲ CHỌN — chỉ kiểm định khi có nhập.
  if (linkUrl && !/^https?:\/\//i.test(linkUrl)) return NextResponse.json({ error: "Link đích phải bắt đầu bằng http(s)://" }, { status: 400 });
  if (!isPlacement(placement)) return NextResponse.json({ error: "Vị trí không hợp lệ." }, { status: 400 });

  // Link Google Maps TUỲ CHỌN — kiểm định + resolve link rút gọn để nhúng được iframe.
  const rawMap = String(b.mapUrl || "").trim();
  let mapUrl: string | undefined;
  if (rawMap) {
    if (rawMap.length > 500 || !isGoogleMapsUrl(rawMap)) return NextResponse.json({ error: "Link Google Maps không hợp lệ." }, { status: 400 });
    mapUrl = await resolveMapUrl(rawMap);
  }

  const ad = await createAd({
    advertiser, title, imageDesktop,
    description: description || undefined,
    imageMobile: typeof b.imageMobile === "string" && b.imageMobile.trim() ? b.imageMobile.trim() : undefined,
    linkUrl, phone: phone || undefined, address: address || undefined, mapUrl,
    placement: placement as AdPlacement,
    weight: Number(b.weight) || 1,
    startDate: b.startDate ? new Date(b.startDate) : null,
    endDate: b.endDate ? new Date(b.endDate) : null,
    active: b.active !== false,
  });
  return NextResponse.json({ ok: true, id: ad._id!.toString() });
}
