import { ShieldAlert } from "lucide-react";

// SAFETY — community moderation notice (PRD § Community: strict moderation for
// unsafe medical advice). Posts that recommend medication or peptide dosing are
// blocked on submission (src/lib/community/moderation.ts).
export function CommunityGuidelines() {
  return (
    <div
      role="note"
      aria-label="Community guidelines"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-sm">
        <p className="font-semibold text-amber-700 dark:text-amber-300">
          Share experiences, not dosing instructions.
        </p>
        <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">
          It&apos;s great to talk about what&apos;s working for you. Please don&apos;t tell others
          how much of a medication or peptide to take, when to inject, or how to run a protocol —
          those posts aren&apos;t allowed. Always point people to a licensed healthcare provider.
        </p>
      </div>
    </div>
  );
}
