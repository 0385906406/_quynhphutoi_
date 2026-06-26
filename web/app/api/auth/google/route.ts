import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
    return NextResponse.redirect(
      new URL("/dang-nhap?error=not_configured", process.env.APP_URL || "http://localhost:3001"),
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const store = await cookies();
  store.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 phút
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
