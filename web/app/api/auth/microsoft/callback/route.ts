import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { findByEmail, findOrCreateMicrosoftUser } from "@/lib/users";

const FAIL = (err: string) =>
  NextResponse.redirect(
    new URL(`/dang-nhap?error=${err}`, process.env.APP_URL || "http://localhost:3001"),
  );

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code || !state) return FAIL("oauth_cancelled");

  const store = await cookies();
  const savedState = store.get("oauth_state_ms")?.value;
  store.delete("oauth_state_ms");
  if (!savedState || savedState !== state) return FAIL("invalid_state");

  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return FAIL("oauth_failed");
  }

  const redirectUri = `${process.env.APP_URL}/api/auth/microsoft/callback`;

  // Đổi code lấy access token
  let accessToken: string;
  try {
    const tokenRes = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code,
          grant_type: "authorization_code",
          scope: "openid email profile User.Read",
        }),
      },
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) return FAIL("oauth_failed");
    accessToken = tokenData.access_token;
  } catch {
    return FAIL("oauth_failed");
  }

  // Lấy thông tin user từ Microsoft Graph
  let microsoftId: string, email: string, name: string;
  try {
    const infoRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) return FAIL("oauth_failed");
    const info = await infoRes.json();
    microsoftId = info.id;
    email = info.mail || info.userPrincipalName || "";
    name = info.displayName || email.split("@")[0];
  } catch {
    return FAIL("oauth_failed");
  }

  if (!microsoftId || !email) return FAIL("oauth_failed");

  let sessionUser: { id: string; email: string; name: string; avatar?: string };
  try {
    const existing = await findByEmail(email);
    if (existing?.banned) return FAIL("banned");

    sessionUser = await findOrCreateMicrosoftUser(microsoftId, email, name);
  } catch {
    return FAIL("oauth_failed");
  }

  await createSession(sessionUser);

  return NextResponse.redirect(new URL("/", process.env.APP_URL || "http://localhost:3001"));
}
