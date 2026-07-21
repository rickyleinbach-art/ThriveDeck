"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PenSquare, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPost } from "@/lib/community/actions";
import {
  BODY_MAX,
  CATEGORY_LABELS,
  COMMUNITY_CATEGORIES,
  TITLE_MAX,
  type CommunityCategory,
} from "@/lib/validations/community";

// Inline "start a post" composer at the top of the feed. Expands on click so
// the feed stays uncluttered. Errors include the moderation block message when
// a post is rejected for dosing content.
export function PostComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CommunityCategory>("GENERAL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setBody("");
    setAnon(false);
    setCategory("GENERAL");
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createPost({ category, title, body, isAnonymous: anon });
      if (!res.success) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
      router.push(`/community/${res.postId}`);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm text-muted-foreground shadow-card transition hover:border-primary/40"
      >
        <PenSquare className="h-5 w-5 text-primary" />
        Share something with the community…
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CommunityCategory)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
          aria-label="Category"
        >
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          Post anonymously
        </label>
      </div>

      <Input
        value={title}
        maxLength={TITLE_MAX}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        aria-label="Post title"
      />
      <textarea
        value={body}
        maxLength={BODY_MAX}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        aria-label="Post body"
        rows={5}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); reset(); }}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || title.trim().length < 3 || body.trim().length === 0}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
