"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

// Fade-up-on-scroll wrapper for marketing sections. Honors prefers-reduced-motion
// by rendering a static div (no transform, no opacity animation) so the page is
// fully legible for users who opt out of motion.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
