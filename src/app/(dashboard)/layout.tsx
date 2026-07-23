import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { visibleNavItems } from "@/components/nav-items";
import { getProfile } from "@/lib/profile/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already guards this, but never render for
  // an unauthenticated user.
  if (!user) redirect("/login");

  // First-time users are routed through the onboarding wizard once, before they
  // ever reach a module page. This layout wraps every dashboard route, so it's
  // the real guard (the group's URLs aren't under /dashboard, so middleware
  // can't cover them). `onboarded` flips true when the wizard completes/skips.
  const profile = await getProfile();
  if (profile && !profile.onboarded) redirect("/onboarding");

  // Hide optional modules the user opted out of (e.g. Peptides).
  const navItems = visibleNavItems({
    tracksPeptides: profile?.tracksPeptides ?? true,
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-4 lg:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Image
            src="/brand/thrivedeck-mark-only-transparent.png"
            alt=""
            width={620}
            height={620}
            className="h-7 w-7"
          />
          <span className="text-lg font-semibold tracking-tight">
            ThriveDeck
          </span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur lg:px-6">
          {/* Mobile shows the brand (nav lives in the bottom bar); desktop shows
              the signed-in user (brand + nav live in the sidebar). */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <Image
              src="/brand/thrivedeck-mark-only-transparent.png"
              alt="ThriveDeck"
              width={620}
              height={620}
              className="h-6 w-6"
            />
            <span className="text-base font-semibold tracking-tight">
              ThriveDeck
            </span>
          </Link>
          <div className="hidden text-sm text-muted-foreground lg:block">
            {user.email}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6 pb-24 lg:pb-6">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>

      {/* Mobile primary navigation */}
      <BottomNav navItems={navItems} />
    </div>
  );
}
