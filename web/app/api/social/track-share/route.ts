import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, slug, title } = body;

    if (!platform || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Log share event (có thể mở rộng để lưu vào DB nếu cần)
    console.log(`[SHARE] ${platform} | ${slug} | ${title || "N/A"}`);

    // Nếu có GA4, có thể gửi event tới GA4 từ server-side (tùy chọn)
    // const gaResponse = await fetch("https://www.google-analytics.com/mp/collect", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     measurement_id: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    //     api_secret: process.env.GA_API_SECRET,
    //     events: [{
    //       name: "share",
    //       params: {
    //         method: platform,
    //         content_id: slug,
    //       },
    //     }],
    //   }),
    // });

    return NextResponse.json(
      {
        success: true,
        message: "Share tracked",
        platform,
        slug,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SHARE TRACK ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
