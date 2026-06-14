// Quảng cáo đang chạy cho 1 vị trí (công khai — AdSlot gọi).
import { NextResponse } from "next/server";
import { listActiveAds, listAllActiveAds, isPlacement } from "@/lib/ads";

export async function GET(req: Request) {
  const placement = new URL(req.url).searchParams.get("placement") || "";
  const rows = placement === "all"
    ? await listAllActiveAds()
    : isPlacement(placement) ? await listActiveAds(placement) : [];
  const adsOut = rows.map((a) => ({
    id: a._id!.toString(),
    advertiser: a.advertiser,
    title: a.title,
    imageDesktop: a.imageDesktop,
    imageMobile: a.imageMobile ?? null,
    weight: a.weight,
  }));
  return NextResponse.json({ ads: adsOut });
}
