import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Scale,
  Syringe,
  ListChecks,
  HeartPulse,
  LineChart,
  TrendingUp,
  Sparkles,
  ChefHat,
  Users,
  Trophy,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { NavIconKey } from "@/components/nav-items";

// Nav items travel from the server layout to the client navs as props, so they
// can only carry plain data — a Lucide component is a function object and will
// not serialize across that boundary. Items name an icon by key and the client
// resolves it here.
export const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  nutrition: Utensils,
  exercise: Dumbbell,
  weight: Scale,
  peptides: Syringe,
  habits: ListChecks,
  health: HeartPulse,
  analytics: LineChart,
  progress: TrendingUp,
  coach: Sparkles,
  recipes: ChefHat,
  community: Users,
  challenges: Trophy,
  profile: User,
  settings: Settings,
};
