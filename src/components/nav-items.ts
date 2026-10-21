// Single source of truth for the dashboard navigation, shared by the desktop
// sidebar and the mobile drawer so the two never drift.

// Module flags that can hide an otherwise-standard nav entry. Optional modules
// (Phase 5 § 5.2) carry a `gate`; a nav item with no gate is always shown. Add
// more flags here to gate other optional modules by the same profile-flag
// pattern.
export type ModuleFlags = { tracksPeptides: boolean };

// Sidebar sections. Fifteen flat links read as an undifferentiated wall, so
// items are bucketed by what the user is trying to do: log something, review
// it, explore, or manage the account. Order here is the render order.
export const NAV_GROUPS = ["overview", "track", "insights", "explore", "account"] as const;

export type NavGroup = (typeof NAV_GROUPS)[number];

// Headings are omitted for `overview` — a single item needs no label above it.
export const NAV_GROUP_LABELS: Record<NavGroup, string | null> = {
  overview: null,
  track: "Track",
  insights: "Insights",
  explore: "Explore",
  account: "Account",
};

export type NavIconKey =
  | "dashboard"
  | "nutrition"
  | "exercise"
  | "weight"
  | "peptides"
  | "habits"
  | "health"
  | "analytics"
  | "progress"
  | "coach"
  | "recipes"
  | "community"
  | "challenges"
  | "profile"
  | "settings";

export type NavItem = {
  label: string;
  href: string;
  // Key, not a component: see nav-icons.ts for why.
  icon: NavIconKey;
  group: NavGroup;
  gate?: keyof ModuleFlags;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", group: "overview" },

  { label: "Nutrition", href: "/nutrition", icon: "nutrition", group: "track" },
  { label: "Exercise", href: "/exercise", icon: "exercise", group: "track" },
  { label: "Weight", href: "/weight", icon: "weight", group: "track" },
  { label: "Peptides", href: "/peptides", icon: "peptides", group: "track", gate: "tracksPeptides" },
  { label: "Habits", href: "/habits", icon: "habits", group: "track" },
  { label: "Health", href: "/health", icon: "health", group: "track" },

  { label: "Analytics", href: "/analytics", icon: "analytics", group: "insights" },
  { label: "Progress", href: "/progress", icon: "progress", group: "insights" },

  { label: "AI Coach", href: "/ai-coach", icon: "coach", group: "explore" },
  { label: "Recipes", href: "/recipes", icon: "recipes", group: "explore" },
  { label: "Community", href: "/community", icon: "community", group: "explore" },
  { label: "Challenges", href: "/challenges", icon: "challenges", group: "explore" },

  { label: "Profile", href: "/profile", icon: "profile", group: "account" },
  { label: "Settings", href: "/settings", icon: "settings", group: "account" },
];

// Drops gated items whose flag is off. Called once server-side (in the
// dashboard layout) and the result is shared with the mobile nav.
export function visibleNavItems(flags: ModuleFlags): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.gate || flags[item.gate]);
}

// Buckets already-gated items into render order, dropping groups a user can't
// see any items in (e.g. Track with every optional module switched off).
export function groupedNavItems(
  items: NavItem[]
): { group: NavGroup; label: string | null; items: NavItem[] }[] {
  return NAV_GROUPS.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: items.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);
}

// Shared by both navs so "active" never means two different things. A child
// route (/weight/history) keeps its parent (/weight) highlighted.
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
