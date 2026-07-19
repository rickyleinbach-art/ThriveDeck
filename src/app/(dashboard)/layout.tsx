import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  "Dashboard",
  "Today",
  "Nutrition",
  "Exercise",
  "Weight",
  "Peptides",
  "Habits",
  "Health",
  "Analytics",
  "Progress",
  "Community",
  "AI Coach",
  "Recipes",
  "Challenges",
  "Profile",
  "Settings",
];

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-4 lg:block">
        <div className="mb-6 px-2 text-lg font-semibold tracking-tight">
          MetabolicOS
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const href =
              item === "Dashboard"
                ? "/dashboard"
                : `/${item.toLowerCase().replace(/\s+/g, "-")}`;
            return (
              <Link
                key={item}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                {item}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-3 backdrop-blur">
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
