import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getModulePerm } from "@/lib/admin-guard";
import { TrafficStats } from "@/components/admin/TrafficStats";
import { InterestPanel } from "@/components/admin/InterestPanel";

export const metadata: Metadata = { title: "Thống kê truy cập — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TrafficPage() {
  const perm = await getModulePerm("thong-ke");
  if (!perm || perm === "none") redirect("/admin/403");
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Thống kê truy cập</h1>
        <p className="qp-admin-head__desc">
          Bài nào đang được đọc nhiều (hôm nay, tuần, tháng này), và lịch sử người vào web theo IP và thiết bị. Chỉ tính người thật, đã loại bot.
        </p>
      </div>
      <InterestPanel />
      <TrafficStats />
    </>
  );
}
