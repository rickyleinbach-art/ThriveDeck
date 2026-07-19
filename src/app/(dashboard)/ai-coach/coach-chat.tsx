"use client";

import { useRef, useState, useTransition } from "react";
import { Send, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askCoach } from "@/lib/coach/actions";
import { MAX_MESSAGE_LENGTH } from "@/lib/validations/coach";
import type { CoachReply } from "@/lib/coach/types";

type Turn =
  | { role: "user"; text: string }
  | { role: "coach"; reply: CoachReply };

const STARTERS = [
  "How am I doing this week?",
  "What should I eat tonight?",
  "What workout should I do today?",
  "Why does protein matter?",
];

export function CoachChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  function send(message: string) {
    const text = message.trim();
    if (!text || pending) return;
    setError(null);
    setValue("");
    setTurns((prev) => [...prev, { role: "user", text }]);

    startTransition(async () => {
      const result = await askCoach({ message: text });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setTurns((prev) => [...prev, { role: "coach", reply: result.reply }]);
      // Scroll the newest reply into view after render.
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(value);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      {/* Conversation */}
      <div ref={scrollRef} className="max-h-[28rem] space-y-4 overflow-y-auto">
        {turns.length === 0 ? (
          <div className="py-6 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm text-muted-foreground">
              Ask about your progress, nutrition, training, or habits. Try one of these:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {turn.text}
                </div>
              </div>
            ) : (
              <CoachBubble key={i} reply={turn.reply} />
            )
          )
        )}

        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            Coach is thinking…
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {/* Composer */}
      <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
        <Input
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask your coach…"
          aria-label="Message your coach"
          disabled={pending}
        />
        <Button type="submit" size="sm" disabled={pending || value.trim().length === 0}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </div>
  );
}

function CoachBubble({ reply }: { reply: CoachReply }) {
  const safety = reply.safety === true;
  return (
    <div className="flex justify-start">
      <div
        className={
          safety
            ? "max-w-[90%] rounded-2xl rounded-bl-sm border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm"
            : "max-w-[90%] rounded-2xl rounded-bl-sm bg-accent px-4 py-3 text-sm"
        }
      >
        {safety && (
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4" />
            Safety first
          </div>
        )}
        <p className={safety ? "text-amber-700/90 dark:text-amber-300/90" : ""}>{reply.text}</p>
        {reply.bullets && reply.bullets.length > 0 && (
          <ul
            className={`mt-2 list-disc space-y-1 pl-5 ${
              safety ? "text-amber-700/90 dark:text-amber-300/90" : "text-muted-foreground"
            }`}
          >
            {reply.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
        {reply.note && (
          <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
            {reply.note}
          </p>
        )}
      </div>
    </div>
  );
}
