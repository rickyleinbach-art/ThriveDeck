import {
  Footprints,
  Map,
  Droplet,
  Beef,
  Flame,
  Dumbbell,
  Timer,
  TrendingDown,
  Sparkles,
  CalendarCheck,
  Medal,
  Trophy,
  Award,
  type LucideIcon,
} from "lucide-react";

// Maps the string icon names used in the challenge catalog and achievement
// definitions to lucide components, so those definitions stay plain data.
const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  map: Map,
  droplet: Droplet,
  beef: Beef,
  flame: Flame,
  dumbbell: Dumbbell,
  timer: Timer,
  "trending-down": TrendingDown,
  sparkles: Sparkles,
  "calendar-check": CalendarCheck,
  medal: Medal,
  trophy: Trophy,
};

export function ChallengeIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Award;
  return <Cmp className={className} />;
}
