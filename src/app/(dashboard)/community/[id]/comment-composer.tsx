"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addComment } from "@/lib/community/actions";
import { COMMENT_MAX } from "@/lib/validations/community";

export function CommentComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addComment({ postId, body, isAnonymous: anon });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setBody("");
      setAnon(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
      <textarea
        value={body}
        maxLength={COMMENT_MAX}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment…"
        aria-label="Add a comment"
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          Anonymously
        </label>
        <Button type="submit" size="sm" disabled={pending || body.trim().length === 0}>
          {pending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
