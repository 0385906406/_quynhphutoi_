import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { findByEmail, findOrCreateGoogleUser } from "@/lib/users";

const FAIL = (err: string) =>
  NextResponse.redirect(
    new URL(`/dang-nhap?error=${err}`, process.env.APP_URL || "http://localhost:3001"),
  );

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  // Người dùng huỷ hoặc Google trả về lỗi
  if (oauthError || !code || !state) return FAIL("oauth_cancelled");

  // Xác minh state (chống CSRF)
  const store = await cookies();
  const savedState = store.get("oauth_state")?.value;
  store.delete("oauth_state");
  if (!savedState || savedState !== state) return FAIL("invalid_state");

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return FAIL("oauth_failed");
  }

  const redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;

  // Đổi code lấy access token
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) return FAIL("oauth_failed");
    accessToken = tokenData.access_token;
  } catch {
    return FAIL("oauth_failed");
  }

  // Lấy thông tin user từ Google
  let googleId: string, email: string, name: string, avatar: string | undefined;
  try {
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) return FAIL("oauth_failed");
    const info = await infoRes.json();
    googleId = info.id;
    email = info.email;
    name = info.name || info.given_name || email.split("@")[0];
    avatar = info.picture || undefined;
  } catch {
    return FAIL("oauth_failed");
  }

  if (!googleId || !email) return FAIL("oauth_failed");

  // Tìm hoặc tạo user, kiểm tra ban
  let sessionUser: { id: string; email: string; name: string; avatar?: string };
  try {
    const existing = await findByEmail(email);
    if (existing?.banned) return FAIL("banned");

    sessionUser = await findOrCreateGoogleUser(googleId, email, name, avatar);
  } catch {
    return FAIL("oauth_failed");
  }

  await createSession(sessionUser);

  return NextResponse.redirect(new URL("/", process.env.APP_URL || "http://localhost:3001"));
}
