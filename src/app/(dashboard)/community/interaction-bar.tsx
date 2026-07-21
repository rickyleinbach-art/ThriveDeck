"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, MessageCircle, Bookmark, Trash2 } from "lucide-react";
import { togglePostLike, toggleSave, deletePost } from "@/lib/community/actions";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isOwn: boolean;
  // On the feed the comment count links to the post; on the detail page it's static.
  commentsHref?: string;
  // Where to go after the owner deletes the post.
  redirectOnDelete?: string;
}

export function InteractionBar({
  postId,
  likeCount,
  commentCount,
  likedByMe,
  savedByMe,
  isOwn,
  commentsHref,
  redirectOnDelete,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(likedByMe);
  const [likes, setLikes] = useState(likeCount);
  const [saved, setSaved] = useState(savedByMe);
  const [pending, startTransition] = useTransition();

  function onLike() {
    const next = !liked;
    // Optimistic — reconcile on the server round trip.
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    startTransition(async () => {
      const res = await togglePostLike(postId, next);
      if (!res.success) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    });
  }

  function onSave() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSave(postId, next);
      if (!res.success) setSaved(!next);
    });
  }

  function onDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    startTransition(async () => {
      const res = await deletePost(postId);
      if (res.success) {
        if (redirectOnDelete) router.push(redirectOnDelete);
        else router.refresh();
      }
    });
  }

  const iconBtn =
    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent";

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onLike} disabled={pending} className={iconBtn} aria-pressed={liked}>
        <Heart className={cn("h-4 w-4", liked && "fill-current text-red-500")} />
        {likes}
      </button>

      {commentsHref ? (
        <Link href={commentsHref} className={iconBtn}>
          <MessageCircle className="h-4 w-4" />
          {commentCount}
        </Link>
      ) : (
        <span className={iconBtn}>
          <MessageCircle className="h-4 w-4" />
          {commentCount}
        </span>
      )}

      <button type="button" onClick={onSave} disabled={pending} className={iconBtn} aria-pressed={saved}>
        <Bookmark className={cn("h-4 w-4", saved && "fill-current text-primary")} />
        <span className="sr-only">{saved ? "Saved" : "Save"}</span>
      </button>

      {isOwn && (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className={cn(iconBtn, "ml-auto hover:text-destructive")}
          aria-label="Delete post"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
