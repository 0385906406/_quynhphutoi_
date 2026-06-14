// Gửi email qua Gmail SMTP (Nodemailer). Nếu chưa cấu hình App Password,
// link sẽ được IN RA TERMINAL để bấm thủ công khi dev.
import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;
const configured = Boolean(user && pass);

const transporter = configured
  ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
  : null;

function layout(title: string, body: string, btnText: string, link: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:28px;border:1px solid #e5e8ed;border-radius:12px;color:#1a1f2e">
    <h2 style="color:#0F4C81;margin:0 0 8px">Quỳnh Phụ Tôi</h2>
    <h3 style="margin:0 0 12px">${title}</h3>
    <p style="line-height:1.6;color:#334155">${body}</p>
    <p style="margin:22px 0">
      <a href="${link}" style="background:#0F4C81;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;display:inline-block;font-weight:600">${btnText}</a>
    </p>
    <p style="font-size:12px;color:#7a8aa0">Hoặc dán liên kết này vào trình duyệt:<br><a href="${link}" style="color:#0F4C81">${link}</a></p>
  </div>`;
}

async function send(to: string, subject: string, html: string, link: string) {
  if (!transporter) {
    console.log(`\n========== [EMAIL chưa cấu hình Gmail] ==========\nTới: ${to}\nChủ đề: ${subject}\n👉 LINK: ${link}\n=================================================\n`);
    return;
  }
  await transporter.sendMail({ from: `Quỳnh Phụ Tôi <${user}>`, to, subject, html });
  console.log(`[EMAIL] đã gửi "${subject}" → ${to}`);
}

export async function sendVerifyEmail(to: string, name: string, link: string) {
  const subject = "Xác nhận tài khoản · Quỳnh Phụ Tôi";
  const html = layout(
    "Xác nhận tài khoản",
    `Chào ${name || "bạn"}, bấm nút bên dưới để kích hoạt tài khoản tại Quỳnh Phụ Tôi.`,
    "Xác nhận email",
    link,
  );
  await send(to, subject, html, link);
}

export async function sendResetEmail(to: string, name: string, link: string) {
  const subject = "Đặt lại mật khẩu · Quỳnh Phụ Tôi";
  const html = layout(
    "Đặt lại mật khẩu",
    `Chào ${name || "bạn"}, bạn vừa yêu cầu đặt lại mật khẩu. Bấm nút bên dưới để tạo mật khẩu mới (liên kết hết hạn sau 1 giờ).`,
    "Đặt lại mật khẩu",
    link,
  );
  await send(to, subject, html, link);
}
