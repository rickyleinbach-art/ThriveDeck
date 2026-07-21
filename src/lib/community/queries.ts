import { createClient } from "@/lib/supabase/server";
import type { FeedSort, CommunityCategory } from "@/lib/validations/community";
import {
  mapComment,
  mapPost,
  type CommunityComment,
  type CommunityCommentRow,
  type CommunityPost,
  type CommunityPostRow,
} from "@/lib/community/types";

const FEED_LIMIT = 50;

interface FeedOptions {
  category?: CommunityCategory;
  sort?: FeedSort;
  savedOnly?: boolean;
}

// The community feed: pinned posts first, then ordered by the chosen sort.
// A second pass loads which of these posts the current user has liked/saved
// (own-row reads only, so no cross-user exposure).
export async function getFeed(opts: FeedOptions = {}): Promise<CommunityPost[]> {
  const { sort = "new", category, savedOnly = false } = opts;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Restrict to the user's saved posts when browsing the Saved tab.
  let savedPostIds: string[] | null = null;
  if (savedOnly) {
    const { data } = await supabase
      .from("community_saves")
      .select("post_id")
      .eq("user_id", user.id);
    savedPostIds = (data ?? []).map((r) => r.post_id as string);
    if (savedPostIds.length === 0) return [];
  }

  let query = supabase
    .from("community_posts")
    .select("*")
    .order("is_pinned", { ascending: false });

  query = sort === "top"
    ? query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
    : query.order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (savedPostIds) query = query.in("id", savedPostIds);

  const { data: rows } = await query.limit(FEED_LIMIT);
  const posts = (rows ?? []) as CommunityPostRow[];
  if (posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const { likedIds, savedIds } = await loadPostInteractions(user.id, ids);

  return posts.map((row) =>
    mapPost(row, { currentUserId: user.id, likedIds, savedIds })
  );
}

export interface PostDetail {
  post: CommunityPost;
  comments: CommunityComment[];
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: postRow } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!postRow) return null;

  const { data: commentRows } = await supabase
    .from("community_comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });
  const comments = (commentRows ?? []) as CommunityCommentRow[];

  const { likedIds, savedIds } = await loadPostInteractions(user.id, [id]);

  // Which comments the current user has liked.
  let commentLikedIds = new Set<string>();
  if (comments.length > 0) {
    const { data } = await supabase
      .from("community_comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", comments.map((c) => c.id));
    commentLikedIds = new Set((data ?? []).map((r) => r.comment_id as string));
  }

  return {
    post: mapPost(postRow as CommunityPostRow, {
      currentUserId: user.id,
      likedIds,
      savedIds,
    }),
    comments: comments.map((row) =>
      mapComment(row, { currentUserId: user.id, likedIds: commentLikedIds })
    ),
  };
}

// The current user's likes and saves among a set of post ids.
async function loadPostInteractions(userId: string, postIds: string[]) {
  const supabase = await createClient();
  const [likeRes, saveRes] = await Promise.all([
    supabase
      .from("community_post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds),
    supabase
      .from("community_saves")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds),
  ]);
  return {
    likedIds: new Set((likeRes.data ?? []).map((r) => r.post_id as string)),
    savedIds: new Set((saveRes.data ?? []).map((r) => r.post_id as string)),
  };
}
