import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      {/* Brand lockup — the mark is theme-safe (charcoal + emerald reads on both
          light and the flagship dark background); the wordmark and tagline are
          rendered as live text so they adapt to the theme and so "Perform."
          can pick up the live brand emerald (--primary) token. */}
      <Image
        src="/brand/thrivedeck-mark-only-transparent.png"
        alt="ThriveDeck"
        width={620}
        height={620}
        priority
        className="mb-6 h-auto w-24 sm:w-28"
      />
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        ThriveDeck
      </h1>
      <p className="mt-4 text-base font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-lg">
        Train. Fuel. Recover. <span className="text-primary">Perform.</span>
      </p>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Track nutrition, training, weight, habits, and labs — then see what
        actually moves the needle. Built to help you get healthier, not just
        log numbers.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border bg-card px-6 py-3 font-medium transition hover:bg-accent"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
