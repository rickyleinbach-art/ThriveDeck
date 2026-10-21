"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calculator,
  Columns3,
  Layers,
  Library,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const BASE = "/peptides/reference";

// One tab per job. The library is the landing tab because "which compound"
// is the question every other tab starts from.
const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: BASE, label: "Library", icon: Library },
  { href: `${BASE}/guide`, label: "Reconstitute", icon: Syringe },
  { href: `${BASE}/calculators`, label: "Calculators", icon: Calculator },
  { href: `${BASE}/compare`, label: "Compare", icon: Columns3 },
  { href: `${BASE}/stacks`, label: "Stacks", icon: Layers },
  { href: `${BASE}/learn`, label: "Learn", icon: BookOpen },
];

export function ReferenceTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Reference sections"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-1 border-b border-border">
        {TABS.map((t) => {
          const active =
            t.href === BASE ? pathname === BASE : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon
                  icon={t.icon}
                  size="sm"
                  className={active ? "text-primary" : undefined}
                />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
