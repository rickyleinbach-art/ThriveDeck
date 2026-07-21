"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Trash2, ShieldAlert } from "lucide-react";
import type { CommunityComment } from "@/lib/community/types";
import { timeAgo } from "@/lib/community/types";
import { FLAGGED_NOTICE } from "@/lib/community/moderation";
import { toggleCommentLike, deleteComment } from "@/lib/community/actions";
import { cn } from "@/lib/utils";

export function CommentItem({
  comment,
  postId,
  now,
}: {
  comment: CommunityComment;
  postId: string;
  now: number;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likes, setLikes] = useState(comment.likeCount);
  const [pending, startTransition] = useTransition();

  function onLike() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleCommentLike(comment.id, postId, next);
      if (!res.success) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    });
  }

  function onDelete() {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const res = await deleteComment(comment.id, postId);
      if (res.success) router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{comment.authorName}</span>
        <span aria-hidden>·</span>
        <span>{timeAgo(comment.createdAt, now)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{comment.body}</p>

      {comment.isFlagged && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {FLAGGED_NOTICE}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          disabled={pending}
          aria-pressed={liked}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent"
        >
          <Heart className={cn("h-3.5 w-3.5", liked && "fill-current text-red-500")} />
          {likes}
        </button>
        {comment.isOwn && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label="Delete comment"
            className="inline-flex items-center rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
