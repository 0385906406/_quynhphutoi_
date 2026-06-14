// Khối tương tác (thích · bình luận · chia sẻ) dùng chung cho trang chi tiết.
// Server component: tự lấy phiên + like + bình luận theo (type, slug).
import { getSession } from "@/lib/auth";
import { socialLikeInfo, listSocialComments } from "@/lib/social";
import { PostInteractions } from "@/components/lostfound/PostInteractions";
import { CommentsSection, type CommentItem } from "@/components/lostfound/CommentsSection";

export async function DetailSocial({ type, slug, title }: { type: string; slug: string; title: string }) {
  const session = await getSession();
  const [{ count, liked }, docs] = await Promise.all([
    socialLikeInfo(type, slug, session?.id),
    listSocialComments(type, slug),
  ]);
  const comments: CommentItem[] = docs.map((c) => ({
    id: c._id!.toString(),
    userName: c.userName,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    mine: !!session && session.id === c.userId.toString(),
  }));
  const apiBase = `/api/social/${type}`;

  return (
    <div className="qp-detail-social">
      <PostInteractions slug={slug} title={title} initialLiked={liked} initialLikeCount={count} commentCount={comments.length} isLoggedIn={!!session} apiBase={apiBase} />
      <CommentsSection slug={slug} initial={comments} isLoggedIn={!!session} currentUserName={session?.name} apiBase={apiBase} />
    </div>
  );
}
