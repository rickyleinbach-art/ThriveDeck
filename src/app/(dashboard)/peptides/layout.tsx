import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile/queries";

// Gate the whole Peptides module (page + history + forms) on the profile flag,
// so a user who opted out can't reach it by typing the URL — hiding the nav
// entry isn't enough (Phase 5 § 5.2). Turning tracking back on in Settings
// restores access immediately.
export default async function PeptidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (profile && !profile.tracksPeptides) redirect("/dashboard");
  return <>{children}</>;
}
