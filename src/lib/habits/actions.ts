"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  habitLogSchema,
  habitSchema,
  RATING_MAX,
  RATING_MIN,
  type HabitInput,
  type HabitLogInput,
} from "@/lib/validations/habit";

// Error messages stay generic so no health data ever reaches logs.

type ActionResult = { success: true } | { success: false; error: string };

function revalidateHabitPages() {
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createHabit(input: HabitInput): Promise<ActionResult> {
  const parsed = habitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid habit" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: parsed.data.name,
    habit_type: parsed.data.habitType,
    goal_type: parsed.data.goalType,
    target_value: parsed.data.targetValue ?? null,
    unit: parsed.data.unit || null,
    schedule_days: [...new Set(parsed.data.scheduleDays)].sort(),
  });

  if (error) return { success: false, error: "Could not save habit" };

  revalidateHabitPages();
  return { success: true };
}

export async function setHabitActiveFormAction(id: string, active: boolean): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) return;

  await supabase
    .from("habits")
    .update({ active })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateHabitPages();
}

export async function deleteHabitFormAction(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) return;

  await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);

  revalidateHabitPages();
}

// Upserts the day's log on (habit_id, logged_on) so re-logging a day
// updates it instead of duplicating. Snapshots the habit name so
// history survives habit deletion.
export async function logHabit(input: HabitLogInput): Promise<ActionResult> {
  const parsed = habitLogSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("name, goal_type")
    .eq("id", parsed.data.habitId)
    .eq("user_id", user.id)
    .single();

  if (habitError || !habit) return { success: false, error: "Habit not found" };

  if (
    habit.goal_type === "RATING" &&
    (parsed.data.value < RATING_MIN || parsed.data.value > RATING_MAX)
  ) {
    return { success: false, error: `Rating must be ${RATING_MIN}–${RATING_MAX}` };
  }

  const { error } = await supabase.from("habit_logs").upsert(
    {
      user_id: user.id,
      habit_id: parsed.data.habitId,
      habit_name: habit.name,
      logged_on: parsed.data.loggedOn,
      value: parsed.data.value,
      notes: parsed.data.notes || null,
    },
    { onConflict: "habit_id,logged_on" }
  );

  if (error) return { success: false, error: "Could not save entry" };

  revalidateHabitPages();
  return { success: true };
}

// Unchecking a habit removes that day's log entirely.
export async function removeHabitLog(habitId: string, loggedOn: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { error } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .eq("logged_on", loggedOn)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not update entry" };

  revalidateHabitPages();
  return { success: true };
}
