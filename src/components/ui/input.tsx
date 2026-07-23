import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, inputMode, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      // Default numeric fields to the decimal keypad on mobile (still
      // overridable per-field, e.g. inputMode="numeric" for integers).
      inputMode={inputMode ?? (type === "number" ? "decimal" : undefined)}
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
