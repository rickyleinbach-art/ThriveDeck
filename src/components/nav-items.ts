// Single source of truth for the dashboard navigation, shared by the desktop
// sidebar and the mobile drawer so the two never drift.
export type NavItem = { label: string; href: string };

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Exercise", href: "/exercise" },
  { label: "Weight", href: "/weight" },
  { label: "Peptides", href: "/peptides" },
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
