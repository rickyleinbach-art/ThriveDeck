// Answers compound questions out of the reference library.
//
// This is a personal deck with a single user, so the coach answers dosing and
// medical questions directly instead of deferring them. It still only repeats
// figures that are written down in src/lib/peptides/reference.ts, and it always
// carries the source tier with the number: an approved-label dose and an
// animal-study dose are not interchangeable, and that distinction is the single
// most useful thing on the page when you are the one drawing the syringe.

import {
  PEPTIDE_REFERENCE,
  TIER_SOURCE_LABELS,
  TIER_LABELS,
  type PeptideReference,
} from "@/lib/peptides/reference";
import type { CoachReply } from "@/lib/coach/types";

// Name plus the aliases people actually type. Longest first so "cjc 1295" wins
// over a bare "cjc", and so a brand name resolves to its compound.
function aliasesFor(c: PeptideReference): string[] {
  const fromAka = c.aka
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  return [c.name, ...fromAka, c.slug.replace(/-/g, " ")]
    .map((s) => s.toLowerCase())
    .filter((s) => s.length >= 3);
}

/** The compound a message is asking about, or null. */
export function matchCompound(message: string): PeptideReference | null {
  // Hyphens and spacing vary wildly in how these are written (bpc-157, bpc 157,
  // BPC157), so compare on a form with those removed.
  const text = message.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  const squashed = text.replace(/\s/g, "");

  let best: { compound: PeptideReference; len: number } | null = null;
  for (const compound of PEPTIDE_REFERENCE) {
    for (const alias of aliasesFor(compound)) {
      const aliasSquashed = alias.replace(/[-_\s]/g, "");
      if (!squashed.includes(aliasSquashed)) continue;
      if (!best || aliasSquashed.length > best.len) {
        best = { compound, len: aliasSquashed.length };
      }
    }
  }
  return best?.compound ?? null;
}

/** True when the message is asking about amounts rather than the compound. */
function asksAboutDose(message: string): boolean {
  return /\b(dose|doses|dosage|dosing|titrat\w*|how\s+much|how\s+many|mg|mcg|iu|units?|protocol|schedule|ramp|taper|start\w*\s+at)\b/i.test(
    message
  );
}

function asksAboutMixing(message: string): boolean {
  return /\b(reconstitut\w*|mix|bac\s?water|bacteriostatic|dilut\w*|solvent|how\s+much\s+water)\b/i.test(
    message
  );
}

function asksAboutStorage(message: string): boolean {
  return /\b(store|storage|storing|fridge|refrigerat\w*|freez\w*|expire\w*|shelf\s?life|stable|stability)\b/i.test(
    message
  );
}

function asksAboutSideEffects(message: string): boolean {
  return /\b(side\s?effect|risk|risks|safe|safety|danger\w*|adverse|reaction|nausea|concern)\b/i.test(
    message
  );
}

// Builds a reply about one compound, weighted to whatever the message asked.
export function compoundAnswer(
  message: string,
  compound: PeptideReference
): CoachReply {
  const source = TIER_SOURCE_LABELS[compound.tier];
  const bullets: string[] = [];

  const wantsDose = asksAboutDose(message);
  const wantsMix = asksAboutMixing(message);
  const wantsStorage = asksAboutStorage(message);
  const wantsSides = asksAboutSideEffects(message);
  // A bare "tell me about X" gets the rounded picture.
  const general = !wantsDose && !wantsMix && !wantsStorage && !wantsSides;

  if (wantsDose || general) {
    bullets.push(`Documented dose (${source}): ${compound.documentedDose}`);
    if (compound.doseNote) bullets.push(compound.doseNote);
    if (compound.frequency) bullets.push(`Frequency: ${compound.frequency}`);
    if (compound.route) bullets.push(`Route: ${compound.route}`);
    if (compound.halfLife) bullets.push(`Half-life: ${compound.halfLife}`);
  }

  if (wantsMix || general) {
    if (compound.solvent) bullets.push(`Solvent: ${compound.solvent}`);
    if (compound.mixes?.length) {
      const m = compound.mixes[0];
      bullets.push(
        `Example mix: ${m.vial} in ${m.ml} mL → ${m.conc} (${m.per} per syringe unit). More in the reference library.`
      );
    }
  }

  if (wantsStorage || general) {
    if (compound.storageDry) bullets.push(`Dry storage: ${compound.storageDry}`);
    if (compound.storageMixed)
      bullets.push(`Once mixed: ${compound.storageMixed}`);
  }

  if (wantsSides || general) {
    bullets.push(compound.worthKnowing);
  }

  const lead = wantsDose
    ? `${compound.name} — documented dosing, from the ${source.toLowerCase()}.`
    : `${compound.name} (${TIER_LABELS[compound.tier].toLowerCase()}). ${compound.summary}`;

  return {
    intent: "education",
    text: lead,
    bullets,
    note:
      compound.tier === "research"
        ? "Research-only compound: these figures come from animal or lab work, not human trials."
        : undefined,
  };
}

/** Full path: compound question → answer, or null to fall through. */
export function peptideReply(message: string): CoachReply | null {
  const compound = matchCompound(message);
  if (!compound) return null;
  return compoundAnswer(message, compound);
}
