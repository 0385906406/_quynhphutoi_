// Danh sách thông báo của người dùng hiện tại + số chưa đọc.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listNotifications, countUnread } from "@/lib/notifications";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [], unread: 0 });

  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Number(sp.get("limit")) || 30, 100);

  const [docs, unread] = await Promise.all([
    listNotifications(session.id, { limit }),
    countUnread(session.id),
  ]);
  const items = docs.map((n) => ({
    id: n._id!.toString(),
    type: n.type,
    title: n.title,
    href: n.href,
    actorName: n.actorName ?? null,
    module: n.module ?? null,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
  return NextResponse.json({ items, unread });
}
