"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  LineChart,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/components/nav-items";

// Primary bottom-nav tabs (mobile only). Capped at 4 core + a "More" tab that
// reveals the full module list. Desktop keeps the sidebar (this is lg:hidden).
type Tab = { label: string; href: string; icon: LucideIcon };

const TABS: Tab[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Nutrition", href: "/nutrition", icon: Utensils },
  { label: "Exercise", href: "/exercise", icon: Dumbbell },
  { label: "Analytics", href: "/analytics", icon: LineChart },
];

// navItems is the already-gated module list from the dashboard layout, so the
// "More" sheet hides the same optional modules the sidebar does.
export function BottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal only after mount (document.body is unavailable during SSR).
  useEffect(() => setMounted(true), []);

  // Close the "More" sheet whenever the route changes.
  useEffect(() => setMoreOpen(false), [pathname]);

  // Prevent background scroll while the sheet is open.
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // "More" is highlighted whenever the current route isn't one of the primary tabs.
  const moreActive = !TABS.some((t) => isActive(t.href));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/90 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch justify-around">
          {TABS.map((t) => {
            const active = isActive(t.href);
            const Icon = t.icon;
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[11px] font-medium transition ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon
                    className="h-6 w-6"
                    strokeWidth={active ? 2.4 : 2}
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.15 : 0}
                  />
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[11px] font-medium transition ${
                moreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Menu className="h-6 w-6" strokeWidth={moreActive ? 2.4 : 2} />
              More
            </button>
          </li>
        </ul>
      </nav>

      {mounted &&
        moreOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMoreOpen(false)}
            />
            <nav className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
              <div className="mb-4 flex items-center justify-between px-2">
                <span className="text-lg font-semibold tracking-tight">More</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
