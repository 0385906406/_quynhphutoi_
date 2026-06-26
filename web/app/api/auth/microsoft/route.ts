import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  if (!process.env.MICROSOFT_CLIENT_ID) {
    return NextResponse.redirect(
      new URL("/dang-nhap?error=not_configured", process.env.APP_URL || "http://localhost:3001"),
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${process.env.APP_URL}/api/auth/microsoft/callback`;

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile User.Read",
    state,
    response_mode: "query",
  });

  const store = await cookies();
  store.set("oauth_state_ms", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`,
  );
}
