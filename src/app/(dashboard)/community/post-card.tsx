import Link from "next/link";
import { Pin, ShieldAlert } from "lucide-react";
import type { CommunityPost } from "@/lib/community/types";
import { timeAgo } from "@/lib/community/types";
import { CATEGORY_LABELS } from "@/lib/validations/community";
import { InteractionBar } from "./interaction-bar";

// A single feed item. The card body links to the post detail; the interaction
// bar is a client island so likes/saves work without navigating.
export function PostCard({ post, now }: { post: CommunityPost; now: number }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
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

      <Link href={`/community/${post.id}`} className="group block">
        <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
          {post.title}
        </h2>
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {post.body}
        </p>
      </Link>

      {post.isFlagged && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          May contain health claims — personal experience, not medical advice.
        </p>
      )}

      <div className="mt-3">
        <InteractionBar
          postId={post.id}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          likedByMe={post.likedByMe}
          savedByMe={post.savedByMe}
          isOwn={post.isOwn}
          commentsHref={`/community/${post.id}`}
        />
      </div>
    </article>
  );
}
