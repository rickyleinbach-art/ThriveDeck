import Link from "next/link";
import { Users } from "lucide-react";
import { getFeed } from "@/lib/community/queries";
import {
  CATEGORY_LABELS,
  COMMUNITY_CATEGORIES,
  FEED_SORTS,
  type CommunityCategory,
  type FeedSort,
} from "@/lib/validations/community";
import { CommunityGuidelines } from "./guidelines";
import { PostComposer } from "./post-composer";
import { PostCard } from "./post-card";

export const metadata = { title: "Community · ThriveDeck" };

interface SearchParams {
  category?: string;
  sort?: string;
  tab?: string;
}

function chipClass(active: boolean) {
  return active
    ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
    : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground";
}

// Build a feed URL preserving the other params.
function feedHref(next: Partial<SearchParams>, current: SearchParams) {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };
  if (merged.category) params.set("category", merged.category);
  if (merged.sort && merged.sort !== "new") params.set("sort", merged.sort);
  if (merged.tab && merged.tab !== "feed") params.set("tab", merged.tab);
  const qs = params.toString();
  return qs ? `/community?${qs}` : "/community";
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const category = COMMUNITY_CATEGORIES.includes(sp.category as CommunityCategory)
    ? (sp.category as CommunityCategory)
    : undefined;
  const sort: FeedSort = FEED_SORTS.includes(sp.sort as FeedSort)
    ? (sp.sort as FeedSort)
    : "new";
  const savedOnly = sp.tab === "saved";

  const posts = await getFeed({ category, sort, savedOnly });
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Users className="h-6 w-6 text-primary" />
          Community
        </h1>
        <p className="mt-1 text-muted-foreground">
          Share progress, ask questions, and support each other. Be kind, and keep medical
          advice to your own experience.
        </p>
      </div>

      <CommunityGuidelines />

      <PostComposer />

      {/* Feed / Saved tabs + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          <Link href={feedHref({ tab: "feed" }, sp)} className={chipClass(!savedOnly)}>
            Feed
          </Link>
          <Link href={feedHref({ tab: "saved" }, sp)} className={chipClass(savedOnly)}>
            Saved
          </Link>
        </div>
        <div className="flex gap-1">
          {FEED_SORTS.map((s) => (
            <Link key={s} href={feedHref({ sort: s }, sp)} className={chipClass(sort === s)}>
              {s === "new" ? "Newest" : "Top"}
            </Link>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <Link href={feedHref({ category: undefined }, sp)} className={chipClass(!category)}>
          All
        </Link>
        {COMMUNITY_CATEGORIES.map((c) => (
          <Link key={c} href={feedHref({ category: c }, sp)} className={chipClass(category === c)}>
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {savedOnly
            ? "You haven't saved any posts yet. Tap the bookmark on a post to keep it here."
            : "No posts yet. Be the first to start a conversation."}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
