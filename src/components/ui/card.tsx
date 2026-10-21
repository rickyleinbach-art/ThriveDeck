import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { type ReactNode } from "react";

export function Card({
  title,
  icon,
  action,
  interactive,
  children,
  className,
}: {
  title?: string;
  /** Module glyph beside the title. Cards in a grid otherwise read as one
   *  undifferentiated block — the icon is what makes a row scannable. */
  icon?: LucideIcon;
  /** Trailing header slot: a trend delta, a count, a link. */
  action?: ReactNode;
  /** Adds hover affordance. Set it when the card is wrapped in a link. */
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Full height + column flow so cards in the same grid row share a
        // baseline instead of ending wherever their content happens to stop.
        "flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card",
        interactive &&
          "transition-colors hover:border-primary/40 hover:bg-accent/30",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {icon && (
              <Icon
                icon={icon}
                size="sm"
                className="shrink-0 text-muted-foreground/60"
              />
            )}
            {title && (
              <h3 className="truncate text-sm font-medium text-muted-foreground">
                {title}
              </h3>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
