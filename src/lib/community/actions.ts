"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCommentSchema,
  createPostSchema,
  type CreateCommentInput,
  type CreatePostInput,
} from "@/lib/validations/community";
import { moderateCommunityText } from "@/lib/community/moderation";

// Community write actions. Moderation runs server-side before every insert so
// it can't be bypassed from the client (PRD § Community: strict moderation for
// unsafe medical advice). Error messages stay generic; no post text is logged.

type ActionResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; postId: string }
  | { success: false; error: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// The user's own display name for the author snapshot. Reads only the user's
// own profile (allowed by RLS). Anonymous posts skip this entirely.
async function displayName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const full = (data?.full_name as string | null)?.trim();
  if (full) return full;
  const email = (data?.email as string | null) ?? "";
  return email.split("@")[0] || "Member";
}

export async function createPost(input: CreatePostInput): Promise<CreateResult> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid post" };
  }

  const verdict = moderateCommunityText(`${parsed.data.title}\n${parsed.data.body}`);
  if (verdict.action === "block") return { success: false, error: verdict.reason };

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const authorName = parsed.data.isAnonymous ? null : await displayName(supabase, user.id);

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      author_name: authorName,
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      is_anonymous: parsed.data.isAnonymous,
      is_flagged: verdict.action === "flag",
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: "Could not publish post" };

  revalidatePath("/community");
  return { success: true, postId: data.id as string };
}

export async function deletePost(id: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: "Could not delete post" };

  revalidatePath("/community");
  return { success: true };
}

export async function addComment(input: CreateCommentInput): Promise<ActionResult> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  }

  const verdict = moderateCommunityText(parsed.data.body);
  if (verdict.action === "block") return { success: false, error: verdict.reason };

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const authorName = parsed.data.isAnonymous ? null : await displayName(supabase, user.id);

  const { error } = await supabase.from("community_comments").insert({
    post_id: parsed.data.postId,
    user_id: user.id,
    author_name: authorName,
    body: parsed.data.body,
    is_anonymous: parsed.data.isAnonymous,
    is_flagged: verdict.action === "flag",
  });
  if (error) return { success: false, error: "Could not add comment" };

  revalidatePath(`/community/${parsed.data.postId}`);
  revalidatePath("/community");
  return { success: true };
}

export async function deleteComment(id: string, postId: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: "Could not delete comment" };

  revalidatePath(`/community/${postId}`);
  return { success: true };
}

// Toggle helpers. `active` is the desired next state (true = liked/saved).
// Insert ignores duplicates so double-clicks are safe; the counter triggers
// keep the denormalized totals correct.
export async function togglePostLike(postId: string, active: boolean): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  if (active) {
    const { error } = await supabase
      .from("community_post_likes")
      .upsert({ user_id: user.id, post_id: postId }, { onConflict: "user_id,post_id", ignoreDuplicates: true });
    if (error) return { success: false, error: "Could not like post" };
  } else {
    const { error } = await supabase
      .from("community_post_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { success: false, error: "Could not unlike post" };
  }

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  return { success: true };
}

export async function toggleSave(postId: string, active: boolean): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  if (active) {
    const { error } = await supabase
      .from("community_saves")
      .upsert({ user_id: user.id, post_id: postId }, { onConflict: "user_id,post_id", ignoreDuplicates: true });
    if (error) return { success: false, error: "Could not save post" };
  } else {
    const { error } = await supabase
      .from("community_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { success: false, error: "Could not unsave post" };
  }

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  return { success: true };
}

export async function toggleCommentLike(
  commentId: string,
  postId: string,
  active: boolean
): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  if (active) {
    const { error } = await supabase
      .from("community_comment_likes")
      .upsert({ user_id: user.id, comment_id: commentId }, { onConflict: "user_id,comment_id", ignoreDuplicates: true });
    if (error) return { success: false, error: "Could not like comment" };
  } else {
    const { error } = await supabase
      .from("community_comment_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);
    if (error) return { success: false, error: "Could not unlike comment" };
  }

  revalidatePath(`/community/${postId}`);
  return { success: true };
}
