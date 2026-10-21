"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The app had no sign-out path at all before the header user menu existed.
// Done server-side so the auth cookies are cleared on the response rather than
// only in the browser, which would leave the session valid for server reads.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
