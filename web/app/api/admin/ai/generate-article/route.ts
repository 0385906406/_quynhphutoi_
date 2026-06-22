// Admin: gọi Gemini API để sinh nội dung bài viết từ tiêu đề + tóm tắt.
// Key ưu tiên: env GEMINI_API_KEY → settings DB (admin có thể điền qua trang Cài đặt → AI).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getSettingsRaw } from "@/lib/settings";
import { logActivity } from "@/lib/activity-log";

const TONE_LABELS: Record<string, string> = {
  "chinh-thong": "chính thống, trang trọng — phù hợp văn bản hành chính địa phương",
  "than-thien": "thân thiện, gần gũi — phù hợp bài tin tức cộng đồng",
  "thong-tin": "thông tin, rõ ràng, ngắn gọn — phù hợp thông báo và hướng dẫn",
};

const LENGTH_LABELS: Record<string, string> = {
  "ngan": "400–600 chữ, 2–3 đoạn chính",
  "vua": "700–1000 chữ, 4–5 đoạn, có mục lớn nhỏ",
  "dai": "1200–1800 chữ, chi tiết đầy đủ, nhiều mục H2/H3",
};

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;

  const body = await req.json().catch(() => ({}));
  const { title, excerpt, category, scope, tone = "chinh-thong", length = "vua", customPrompt = "" } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Thiếu tiêu đề bài viết." }, { status: 400 });

  const settings = await getSettingsRaw();
  const apiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Chưa cấu hình Gemini API key. Vào Cài đặt → AI & nội dung để thiết lập, hoặc thêm GEMINI_API_KEY vào file .env." },
      { status: 400 },
    );
  }

  const scopeLabel = scope === "trong-xa" ? "Trong xã Quỳnh Phụ" : "Ngoài xã (tin trong nước / thế giới)";
  const toneLabel = TONE_LABELS[tone] ?? TONE_LABELS["chinh-thong"];
  const lengthLabel = LENGTH_LABELS[length] ?? LENGTH_LABELS["vua"];

  const prompt = `Bạn là biên tập viên nội dung của "Cổng thông tin xã Quỳnh Phụ, Thái Bình" — trang thông tin điện tử địa phương phục vụ người dân.

Hãy viết nội dung bài viết HOÀN CHỈNH dưới dạng HTML. Chỉ trả về phần thân bài — KHÔNG có thẻ <html>, <head>, <body>, không bọc trong markdown (\`\`\`).

Chỉ dùng các thẻ: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>
KHÔNG dùng <h1> (tiêu đề đã có bên ngoài khung soạn thảo).
KHÔNG thêm lời chào, giải thích, hay văn bản ngoài HTML.

Thông tin bài viết:
- Tiêu đề: ${title.trim()}${excerpt?.trim() ? `\n- Tóm tắt / sapo: ${excerpt.trim()}` : ""}${category ? `\n- Chuyên mục: ${category}` : ""}
- Phạm vi: ${scopeLabel}
- Giọng văn: ${toneLabel}
- Độ dài mục tiêu: ${lengthLabel}${customPrompt?.trim() ? `\n- Yêu cầu thêm: ${customPrompt.trim()}` : ""}

Chỉ trả về HTML, bắt đầu ngay từ thẻ đầu tiên.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err?.error?.message as string) || `Gemini API trả về lỗi ${res.status}.`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    let html: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Loại bỏ markdown fence nếu model vẫn bọc (phòng trường hợp model không nghe)
    html = html.replace(/^```html?\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    if (!html) return NextResponse.json({ error: "Gemini không trả về nội dung." }, { status: 502 });

    void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "ai.generate", target: { type: "tin-tuc", label: title }, success: true });
    return NextResponse.json({ html });
  } catch {
    return NextResponse.json({ error: "Không thể kết nối Gemini API. Kiểm tra kết nối mạng và API key." }, { status: 502 });
  }
}
