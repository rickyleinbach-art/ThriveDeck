"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/nav-items";

// Mobile navigation: a hamburger button (hidden on lg+) that opens a slide-out
// drawer with the full nav. The desktop sidebar handles lg+ screens.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portal only after mount (document.body is unavailable during SSR).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ml-1 rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <nav className="absolute left-0 top-0 flex h-full w-64 flex-col overflow-y-auto border-r border-border bg-card p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Image
                  src="/brand/thrivedeck-mark-only-transparent.png"
                  alt=""
                  width={620}
                  height={620}
                  className="h-6 w-6"
                />
                ThriveDeck
              </span>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          </div>,
          document.body
        )}
    </>
  );
}
