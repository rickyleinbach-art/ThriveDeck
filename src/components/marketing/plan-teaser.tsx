"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  PRIMARY_GOALS,
  PRIMARY_GOAL_LABELS,
  type PrimaryGoal,
} from "@/lib/validations/onboarding";

// Illustrative only — no data is saved. This mirrors the real onboarding goal
// step so a visitor can feel the product before hitting the signup wall. The
// "focus" copy is purely about which modules lead the dashboard; it makes no
// health, dosing, or outcome claims.
const GOAL_FOCUS: Record<PrimaryGoal, string[]> = {
  LOSE_FAT: ["Nutrition", "Weight trend", "Habits"],
  BUILD_MUSCLE: ["Training", "Protein & nutrition", "Weight trend"],
  IMPROVE_PERFORMANCE: ["Training", "Analytics", "Health metrics"],
  GENERAL_HEALTH: ["Habits", "Health metrics", "Nutrition"],
  RECOVERY_REHAB: ["Health metrics", "Habits", "AI Coach"],
  MAINTAIN: ["Habits", "Weight trend", "Nutrition"],
};

export function PlanTeaser() {
  const [goal, setGoal] = useState<PrimaryGoal | null>(null);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        See your plan in 60 seconds
      </p>
      <h3 className="mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        What are you working toward?
      </h3>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
        Pick a goal to preview how your dashboard would focus. No account needed yet.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {PRIMARY_GOALS.map((g) => {
          const selected = goal === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-background hover:border-primary/50 hover:bg-accent"
              }`}
            >
              {PRIMARY_GOAL_LABELS[g]}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {goal && (
          <motion.div
            key={goal}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-8 rounded-2xl border border-border bg-background p-5"
          >
            <p className="text-sm text-muted-foreground">
              Based on your goal, your dashboard would lead with:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {GOAL_FOCUS[goal].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {f}
                </span>
              ))}
            </div>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 sm:w-auto"
            >
              Create your free account to start
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
