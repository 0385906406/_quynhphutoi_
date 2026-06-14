// Tiện ích client gọi reCAPTCHA v3. Script nạp ở app/layout.tsx (khi có site key).
// Chưa cấu hình key → trả "" (server cũng bỏ qua khi chưa có secret).
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

type Grecaptcha = {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, opts: { action: string }) => Promise<string>;
};

export async function executeRecaptcha(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) return "";
  const g = (window as unknown as { grecaptcha?: Grecaptcha }).grecaptcha;
  if (!g) return "";
  try {
    await new Promise<void>((resolve) => g.ready(() => resolve()));
    return await g.execute(RECAPTCHA_SITE_KEY, { action });
  } catch {
    return "";
  }
}
