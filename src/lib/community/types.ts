import type { CommunityCategory } from "@/lib/validations/community";

// Community domain model (Module 9). Rows are the snake_case shape Supabase
// returns; the mapped types are what the UI consumes. author_name is a
// write-time snapshot (null when anonymous — render as "Anonymous").

export interface CommunityPostRow {
  id: string;
  user_id: string;
  author_name: string | null;
  category: CommunityCategory;
  title: string;
  body: string;
  image_path: string | null;
  is_anonymous: boolean;
  is_pinned: boolean;
  is_flagged: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  authorName: string; // resolved display name ("Anonymous" when hidden)
  isOwn: boolean;
  category: CommunityCategory;
  title: string;
  body: string;
  imagePath: string | null;
  isAnonymous: boolean;
  isPinned: boolean;
  isFlagged: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
}

export function resolveAuthorName(row: {
  author_name: string | null;
  is_anonymous: boolean;
}): string {
  if (row.is_anonymous) return "Anonymous";
  return row.author_name?.trim() || "Member";
}

export function mapPost(
  row: CommunityPostRow,
  ctx: { currentUserId: string | null; likedIds: Set<string>; savedIds: Set<string> }
): CommunityPost {
  return {
    id: row.id,
    authorName: resolveAuthorName(row),
    isOwn: ctx.currentUserId === row.user_id,
    category: row.category,
    title: row.title,
    body: row.body,
    imagePath: row.image_path,
    isAnonymous: row.is_anonymous,
    isPinned: row.is_pinned,
    isFlagged: row.is_flagged,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: ctx.likedIds.has(row.id),
    savedByMe: ctx.savedIds.has(row.id),
    createdAt: row.created_at,
  };
}

export interface CommunityCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  body: string;
  is_anonymous: boolean;
  is_flagged: boolean;
  like_count: number;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  isOwn: boolean;
  body: string;
  isFlagged: boolean;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export function mapComment(
  row: CommunityCommentRow,
  ctx: { currentUserId: string | null; likedIds: Set<string> }
): CommunityComment {
  return {
    id: row.id,
    authorName: resolveAuthorName(row),
    isOwn: ctx.currentUserId === row.user_id,
    body: row.body,
    isFlagged: row.is_flagged,
    likeCount: row.like_count,
    likedByMe: ctx.likedIds.has(row.id),
    createdAt: row.created_at,
  };
}

// Relative "time ago" for feed timestamps. Pure and UTC-safe.
export function timeAgo(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
