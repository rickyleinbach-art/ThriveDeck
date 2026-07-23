"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const THRESHOLD = 70;

// Pull-to-refresh for touch devices. Only engages when the page is scrolled to
// the very top and pulled downward; a no-op on desktop (no touch events fire).
// Uses passive listeners so it never blocks native scrolling.
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    function setDistance(d: number) {
      pullRef.current = d;
      setPull(d);
    }
    function onStart(e: TouchEvent) {
      startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    }
    function onMove(e: TouchEvent) {
      if (startY.current === null || refreshingRef.current || window.scrollY > 0) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) setDistance(Math.min(dy * 0.5, THRESHOLD + 20));
    }
    function onEnd() {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setDistance(THRESHOLD);
        router.refresh();
        window.setTimeout(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setDistance(0);
        }, 700);
      } else {
        setDistance(0);
      }
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden"
        style={{ height: pull }}
      >
        <Icon
          icon={RefreshCw}
          className={cn("mt-2 text-muted-foreground", refreshing && "animate-spin")}
          style={{ opacity: Math.min(pull / THRESHOLD, 1) }}
        />
      </div>
      <div
        className="transition-transform"
        style={{ transform: `translateY(${pull}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
