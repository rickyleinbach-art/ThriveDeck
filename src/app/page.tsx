import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
        Metabolic health, unified
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Everything your body is telling you, in one calm place.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
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
