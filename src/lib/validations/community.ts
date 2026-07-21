import { z } from "zod";

// Community (Module 9). Mirrors the enums/constraints in
// prisma/migrations/0009_community.sql.

export const COMMUNITY_CATEGORIES = [
  "WEIGHT_LOSS",
  "NUTRITION",
  "FITNESS",
  "RECIPES",
  "WALKING_CLUB",
  "STRENGTH",
  "CARDIO",
  "PEPTIDE_EXPERIENCES",
  "LIFESTYLE",
  "SUCCESS_STORIES",
  "PROGRESS_PICS",
  "MOTIVATION",
  "MEAL_PREP",
  "QUESTIONS",
  "GENERAL",
] as const;
export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CommunityCategory, string> = {
  WEIGHT_LOSS: "Weight loss",
  NUTRITION: "Nutrition",
  FITNESS: "Fitness",
  RECIPES: "Recipes",
  WALKING_CLUB: "Walking club",
  STRENGTH: "Strength",
  CARDIO: "Cardio",
  PEPTIDE_EXPERIENCES: "Peptide experiences",
  LIFESTYLE: "Lifestyle",
  SUCCESS_STORIES: "Success stories",
  PROGRESS_PICS: "Progress pics",
  MOTIVATION: "Motivation",
  MEAL_PREP: "Meal prep",
  QUESTIONS: "Questions",
  GENERAL: "General",
};

export const FEED_SORTS = ["new", "top"] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

export const TITLE_MAX = 160;
export const BODY_MAX = 8000;
export const COMMENT_MAX = 4000;

export const createPostSchema = z.object({
  category: z.enum(COMMUNITY_CATEGORIES),
  title: z.string().trim().min(3, "Give your post a title").max(TITLE_MAX),
  body: z.string().trim().min(1, "Write something").max(BODY_MAX),
  isAnonymous: z.boolean().default(false),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a comment").max(COMMENT_MAX),
  isAnonymous: z.boolean().default(false),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
