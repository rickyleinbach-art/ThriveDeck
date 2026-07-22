import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pin, ShieldAlert } from "lucide-react";
import { getPost } from "@/lib/community/queries";
import { timeAgo } from "@/lib/community/types";
import { CATEGORY_LABELS } from "@/lib/validations/community";
import { FLAGGED_NOTICE } from "@/lib/community/moderation";
import { InteractionBar } from "../interaction-bar";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";

export const metadata = { title: "Post · ThriveDeck" };

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPost(id);
  if (!detail) notFound();

  const { post, comments } = detail;
  const now = Date.now();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Community
      </Link>

      <article className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
            {CATEGORY_LABELS[post.category]}
          </span>
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          <span>{post.authorName}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(post.createdAt, now)}</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

        {post.isFlagged && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {FLAGGED_NOTICE}
          </p>
        )}

        <div className="mt-4 border-t border-border pt-3">
          <InteractionBar
            postId={post.id}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            likedByMe={post.likedByMe}
            savedByMe={post.savedByMe}
            isOwn={post.isOwn}
            redirectOnDelete="/community"
          />
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </h2>

        <CommentComposer postId={post.id} />

        {comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No comments yet. Start the conversation.
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} postId={post.id} now={now} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
