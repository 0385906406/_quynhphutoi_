import { NextResponse } from "next/server";
import { verifyByToken } from "@/lib/users";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const base = process.env.APP_URL || url.origin;

  const u = await verifyByToken(token);
  const status = u ? "success" : "invalid";
  return NextResponse.redirect(`${base}/dang-nhap?verify=${status}`);
}
