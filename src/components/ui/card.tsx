import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-card",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
