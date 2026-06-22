import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { getAnomalies } from "@/lib/activity-log";

export async function GET(_req: Request) {
  const g = await requirePerm("hoat-dong", "view");
  if (g instanceof NextResponse) return g;
  const items = await getAnomalies();
  return NextResponse.json({ items });
}
