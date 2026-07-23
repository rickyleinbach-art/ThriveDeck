// Single source of truth for the dashboard navigation, shared by the desktop
// sidebar and the mobile drawer so the two never drift.

// Module flags that can hide an otherwise-standard nav entry. Optional modules
// (Phase 5 § 5.2) carry a `gate`; a nav item with no gate is always shown. Add
// more flags here to gate other optional modules by the same profile-flag
// pattern.
export type ModuleFlags = { tracksPeptides: boolean };

export type NavItem = { label: string; href: string; gate?: keyof ModuleFlags };

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Exercise", href: "/exercise" },
  { label: "Weight", href: "/weight" },
  { label: "Peptides", href: "/peptides", gate: "tracksPeptides" },
  { label: "Habits", href: "/habits" },
  { label: "Health", href: "/health" },
  { label: "Analytics", href: "/analytics" },
  { label: "Progress", href: "/progress" },
  { label: "Community", href: "/community" },
  { label: "AI Coach", href: "/ai-coach" },
  { label: "Recipes", href: "/recipes" },
  { label: "Challenges", href: "/challenges" },
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
];

// Drops gated items whose flag is off. Called once server-side (in the
// dashboard layout) and the result is shared with the mobile nav.
export function visibleNavItems(flags: ModuleFlags): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.gate || flags[item.gate]);
}
