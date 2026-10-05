import { type NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-guard";
import { isAdmin } from "@/lib/users";
import {
  dailyNewCountsRange, monthlyNewCounts,
  dailyUserRegistrationsRange, monthlyUserRegistrations,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

type Period = "day" | "month" | "quarter" | "year";

export async function GET(req: NextRequest) {
  // Nhân sự quản trị (admin / editor / vai trò tuỳ chỉnh) — guard chung.
  const g = await requireStaff();
  if (g instanceof NextResponse) return g;
  const user = g.user;

  const period = (req.nextUrl.searchParams.get("period") ?? "month") as Period;
  const now    = new Date();
  const Y      = now.getFullYear();
  const M      = now.getMonth(); // 0-indexed

  let daily   = null;
  let monthly = null;

  if (period === "day") {
    const start = new Date(Y, M, now.getDate(), 0, 0, 0, 0);
    const end   = new Date(Y, M, now.getDate(), 23, 59, 59, 999);
    daily = await dailyNewCountsRange(start, end);
  } else if (period === "month") {
    const start = new Date(Y, M, 1);
    daily = await dailyNewCountsRange(start, now);
  } else if (period === "quarter") {
    const q     = Math.floor(M / 3);
    const start = new Date(Y, q * 3, 1);
    daily = await dailyNewCountsRange(start, now);
  } else {
    monthly = await monthlyNewCounts(Y);
  }

  const resp: Record<string, unknown> = { period, daily, monthly };

  if (isAdmin(user)) {
    if (period === "year") {
      resp.userMonthly = await monthlyUserRegistrations(Y);
    } else if (daily) {
      const start = new Date(daily[0]?.date ?? now.toISOString().slice(0, 10));
      resp.userDaily = await dailyUserRegistrationsRange(start, now);
    }
  }

  return NextResponse.json(resp);
}
