import { type LucideIcon, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared icon wrapper. Enforces the icon size scale and stroke width in one
// place so call sites don't sprinkle one-off dimensions. Color inherits
// currentColor, so callers drive it with a text-* token (e.g. text-primary for
// active, text-muted-foreground for default).
const ICON_SIZES = {
  sm: "h-4 w-4", // 16px — inline with text
  md: "h-5 w-5", // 20px — default UI
  lg: "h-6 w-6", // 24px — nav / primary actions
} as const;

export type IconSize = keyof typeof ICON_SIZES;

export function Icon({
  icon: IconComponent,
  size = "md",
  className,
  ...props
}: { icon: LucideIcon; size?: IconSize } & Omit<LucideProps, "size" | "ref">) {
  return (
    <IconComponent
      strokeWidth={2}
      aria-hidden="true"
      className={cn(ICON_SIZES[size], "shrink-0", className)}
      {...props}
    />
  );
}
