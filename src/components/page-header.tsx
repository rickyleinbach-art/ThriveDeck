import { type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { type ReactNode } from "react";

// Every module page hand-rolled the same title block, and they had drifted:
// some carried a primary-tinted glyph, most didn't, and trailing links were
// spaced differently page to page. One component so a module is recognisable
// by its icon and the header never drifts again.
export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Trailing controls — sub-route links, a primary action. */
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Icon icon={icon} size="lg" className="text-primary" />
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 text-sm">{actions}</div>
      )}
    </div>
  );
}
