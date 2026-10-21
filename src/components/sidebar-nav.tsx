"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  groupedNavItems,
  isNavItemActive,
  type NavItem,
} from "@/components/nav-items";
import { NAV_ICONS } from "@/components/nav-icons";

// Desktop sidebar navigation. Client-side because the active route can only be
// resolved in the browser; the item list itself is gated server-side and passed
// down, so this never decides what a user is allowed to see.
export function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const sections = groupedNavItems(navItems);

  return (
    <nav aria-label="Primary" className="space-y-6">
      {sections.map((section) => (
        <div key={section.group} className="space-y-1">
          {section.label && (
            <h2 className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </h2>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      // The left rule is transparent until active, so items
                      // never shift horizontally when selection moves.
                      "group relative flex items-center gap-3 rounded-lg border-l-2 border-transparent py-2 pl-3 pr-3 text-sm font-medium transition",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon
                      icon={NAV_ICONS[item.icon]}
                      className={cn(
                        "transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-accent-foreground"
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
