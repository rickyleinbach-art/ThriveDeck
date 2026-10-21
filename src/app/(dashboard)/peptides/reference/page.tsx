import type { Metadata } from "next";
import Link from "next/link";
import {
  APPROVED_COUNT,
  REFERENCE_COMPOUNDS,
  REFERENCE_SOLVENTS,
} from "@/lib/peptides/reference";
import { MedicalDisclaimer } from "../disclaimer";
import { CompoundLibrary } from "./compound-library";
import { DosingTable } from "./dosing-table";
import { MixingCalculator } from "./mixing-calculator";
import {
  Callout,
  DataTable,
  Formula,
  NumberedSteps,
  Prose,
  RefSection,
} from "./sections";

export const metadata: Metadata = {
  title: "Peptide reference",
  description:
    "An educational reference: what each compound is, how much evidence stands behind it, how it is mixed and stored.",
};

const JUMP_LINKS = [
  { href: "#library", label: "Compound library" },
  { href: "#mixing", label: "Mixing calculator" },
  { href: "#howto", label: "How to reconstitute" },
  { href: "#storage", label: "Storage" },
  { href: "#dosing", label: "Dosing reference" },
  { href: "#units", label: "Units & labels" },
  { href: "#naming", label: "Name decoder" },
  { href: "#halflife", label: "Half-life" },
  { href: "#quality", label: "Purity & testing" },
  { href: "#mistakes", label: "Common mistakes" },
  { href: "#glossary", label: "Glossary" },
];

const STATS = [
  { value: String(REFERENCE_COMPOUNDS.length), label: "Compounds" },
  { value: String(APPROVED_COUNT), label: "Approved medicines" },
  { value: String(REFERENCE_SOLVENTS.length), label: "Solvent types" },
  { value: "U-100", label: "Syringe scale used" },
];

export default function PeptideReferencePage() {
  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Peptide reference
          </h1>
          <p className="mt-1 max-w-prose text-muted-foreground">
            An educational library: what each compound is, how much evidence
            stands behind it, how it is mixed, and how it is stored.
          </p>
        </div>
        <Link
          href="/peptides"
          className="shrink-0 text-sm text-primary hover:underline"
        >
          Back to peptides
        </Link>
      </div>

      <MedicalDisclaimer />

      <Callout className="border-amber-500/40 bg-amber-500/10">
        <span className="font-semibold">
          Everything here describes what has already been published.
        </span>{" "}
        Dose figures are summaries of approved labels, clinical trial protocols,
        and preclinical studies, each tagged with its source. They are reference
        material, not a recommendation, a protocol, or a suggestion for you. Most
        compounds described are not approved for human use. Talk to your licensed
        provider before starting, changing, or stopping anything.
      </Callout>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <nav aria-label="Jump to a section" className="flex flex-wrap gap-2">
        {JUMP_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-accent hover:text-accent-foreground"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <RefSection id="basics" title="Start here: what a peptide is">
        <Prose>
          A peptide is a short chain of amino acids — the same building blocks
          that make up proteins. Chains of roughly 2 to 50 amino acids get called
          peptides; longer ones are proteins. Your body already makes thousands of
          them. Insulin is a peptide. So is oxytocin, and so is the hormone that
          tells your pituitary to release growth hormone.
        </Prose>
        <Prose>
          Because peptides are the body&apos;s own signalling language, synthetic
          versions can copy, boost, or block a natural signal with real precision.
          That&apos;s the appeal. The catch is that they&apos;re fragile: stomach
          acid destroys them, which is why nearly everything here ships as
          freeze-dried powder in a vial that has to be mixed with liquid before
          use — and why heat, hard shaking, and time in solution all degrade them.
        </Prose>
        <Callout>
          <span className="font-semibold">How to read this library.</span> Every
          compound carries one of three labels.{" "}
          <span className="font-medium">Approved medicine</span> means a regulator
          has cleared it and there is a full label behind the dosing.{" "}
          <span className="font-medium">In human trials</span> means real people
          have taken it under supervision, but nothing is settled.{" "}
          <span className="font-medium">Research only</span> means the evidence is
          animal or laboratory work — the doses in those entries come from the
          studies themselves and have never been established in humans.
        </Callout>
      </RefSection>

      <section id="library" className="scroll-mt-24">
        <CompoundLibrary />
      </section>

      <RefSection
        id="mixing"
        title="Mixing calculator"
        note="Enter what is on your own vial and what you are working out. The calculator converts to a U-100 insulin syringe, where 100 units equals 1 mL and each unit holds 0.01 mL. It does not suggest an amount."
      >
        <MixingCalculator />

        <h3 className="pt-2 text-sm font-semibold">
          The math, if you would rather do it yourself
        </h3>
        <Prose>
          There is really only one relationship to remember, and one conversion on
          top of it.
        </Prose>
        <Formula>concentration = mg in vial ÷ mL of solvent added</Formula>
        <Formula>
          mcg per unit = (mg in vial × 1000) ÷ (mL added × 100)
        </Formula>
        <Prose>
          Adding more solvent never changes how much peptide is in the vial — only
          how spread out it is. More solvent gives a bigger, easier-to-read volume
          per dose, which improves accuracy when the amounts are small. Less
          solvent gives a smaller injection. A dilution that puts the amount
          somewhere in the readable middle of the syringe beats one that lands at
          one or two units, where a slight misjudgement of the plunger becomes a
          large proportional error.
        </Prose>

        <DataTable
          headers={["Vial", "Solvent", "Concentration", "Per unit", "10 units gives"]}
          minWidth="34rem"
          rows={[
            ["2 mg", "1 mL", "2 mg/mL", "20 mcg", "200 mcg"],
            ["5 mg", "2 mL", "2.5 mg/mL", "25 mcg", "250 mcg"],
            ["10 mg", "2 mL", "5 mg/mL", "50 mcg", "500 mcg"],
            ["10 mg", "1 mL", "10 mg/mL", "100 mcg", "1 mg"],
            ["50 mg", "2 mL", "25 mg/mL", "250 mcg", "2.5 mg"],
            ["100 mg", "3 mL", "33.3 mg/mL", "333 mcg", "3.33 mg"],
            ["5,000 IU", "2 mL", "2,500 IU/mL", "25 IU", "250 IU"],
            ["10,000 IU", "2 mL", "5,000 IU/mL", "50 IU", "500 IU"],
          ]}
        />
      </RefSection>

      <RefSection
        id="howto"
        title="How to reconstitute"
        note="Freeze-drying is what makes these compounds stable enough to ship. The powder is often a barely visible film at the bottom of the vial — a 5 mg vial looking almost empty is normal, not a short fill."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {REFERENCE_SOLVENTS.map((s) => (
            <div
              key={s.slug}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.aka}</div>
              <p className="mt-2 text-sm text-foreground/90">{s.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Used for:</span>{" "}
                {s.studiedFor}
              </p>
            </div>
          ))}
        </div>

        <NumberedSteps
          steps={[
            <>
              <span className="font-medium">
                Let the vial reach room temperature.
              </span>{" "}
              Introducing liquid into a cold vial invites condensation, and
              peptides degrade faster wet than dry.
            </>,
            <>
              <span className="font-medium">Swab both stoppers</span> — peptide
              vial and solvent vial — with alcohol and let them air dry rather
              than wiping them.
            </>,
            <>
              <span className="font-medium">Draw your solvent</span> and insert
              the needle into the peptide vial at an angle, so the tip touches the
              glass wall rather than pointing at the powder.
            </>,
            <>
              <span className="font-medium">Push the plunger slowly</span> and let
              the liquid run down the side of the vial. This is the step people
              get wrong: a jet of liquid striking the powder directly can break
              the bonds holding the molecule&apos;s shape.
            </>,
            <>
              <span className="font-medium">Don&apos;t shake it.</span> Set it
              down and wait. Most peptides dissolve on their own within a few
              minutes. If material remains, roll the vial gently between your
              palms.
            </>,
            <>
              <span className="font-medium">Check the result.</span> It should be
              completely clear. Foam means it was agitated too hard. Cloudiness or
              floating strands after gentle mixing means either the wrong solvent
              or a compromised product.
            </>,
          ]}
        />
      </RefSection>

      <RefSection
        id="storage"
        title="Storage & shelf life"
        note="Dry powder is remarkably tough. Once it is in solution, the clock speeds up considerably."
      >
        <DataTable
          headers={["State", "Where it goes", "Roughly how long", "What ruins it"]}
          minWidth="36rem"
          emphasizeFirst
          rows={[
            [
              "Freeze-dried powder",
              "Freezer, dry and dark",
              "Years",
              "Moisture, repeated warming",
            ],
            [
              "Freeze-dried powder",
              "Refrigerator",
              "Many months",
              "Humidity, light",
            ],
            [
              "Mixed, bacteriostatic water",
              "Refrigerator, 2–8 °C",
              "3–4 weeks",
              "Freezing, light, heat",
            ],
            [
              "Mixed, sterile water or PBS",
              "Refrigerator, 2–8 °C",
              "A few days",
              "No preservative — contamination",
            ],
          ]}
        />
        <Callout>
          <span className="font-semibold">Never freeze a mixed vial.</span> Ice
          crystals form and tear the molecule apart, and repeat freeze–thaw cycles
          are the fastest way to destroy a product. If a solution genuinely has to
          be kept long term, splitting it into single-use aliquots and freezing
          those once is the usual approach. Keep everything out of direct light —
          the copper peptides and several neuropeptides are light-sensitive, and
          an opaque box solves it. If a solution that was clear turns cloudy,
          it&apos;s done, regardless of the date.
        </Callout>
      </RefSection>

      <RefSection
        id="dosing"
        title="Dosing reference"
        note="Each figure below is tagged by where it comes from, and the difference matters more than the number."
      >
        <Callout className="border-amber-500/40 bg-amber-500/10">
          <span className="font-semibold">
            Read the tag, not just the figure.
          </span>{" "}
          An <span className="font-medium">approved-label</span> dose comes from a
          regulator-cleared label. A <span className="font-medium">trial</span>{" "}
          dose is what published human studies used under medical supervision. A{" "}
          <span className="font-medium">research</span> dose is what an animal or
          laboratory study used — those have never been established in people, and
          animal dosing does not scale directly to humans. Nothing in this table
          is a recommendation or a protocol.
        </Callout>
        <DosingTable />
      </RefSection>

      <RefSection
        id="units"
        title="Units, labels, and what the numbers mean"
        note="Most mistakes in this field are arithmetic, not pharmacology. Three conventions cause nearly all of the confusion."
      >
        <h3 className="text-sm font-semibold">Reading a catalog line</h3>
        <Prose>
          A specification written as <span className="font-medium">10 mg × 10 vials</span>{" "}
          means each individual vial holds 10 mg, and the box contains ten of them
          — not 10 mg spread across ten vials. Every calculation on this page
          refers to a single vial.
        </Prose>

        <h3 className="pt-2 text-sm font-semibold">
          Milligrams, micrograms, international units
        </h3>
        <DataTable
          headers={["Unit", "Means", "Relationship"]}
          rows={[
            ["mg", "Milligram", "1 mg = 1,000 mcg"],
            ["mcg (µg)", "Microgram", "1,000 mcg = 1 mg"],
            [
              "IU",
              "International unit",
              <>
                A measure of biological <em>activity</em>, not mass
              </>,
            ],
          ]}
        />
        <Prose>
          International units matter because they cannot be converted to
          milligrams by any general formula — the conversion is specific to each
          substance, since IU measures what a compound does rather than what it
          weighs. HCG and HMG are the two products here supplied in IU, and they
          must be calculated in IU throughout.
        </Prose>

        <h3 className="pt-2 text-sm font-semibold">Why the syringe reads in units</h3>
        <Prose>
          A U-100 insulin syringe is marked 0–100 for insulin dosing, where 100
          units of insulin occupies exactly 1 mL. For everything else, those marks
          are simply a volume scale:{" "}
          <span className="font-medium">1 unit = 0.01 mL</span>, regardless of
          what is in the barrel. A &ldquo;20 unit&rdquo; mark means 0.2 mL. This
          is why the same peptide amount can sit at different marks depending on
          how much solvent was added.
        </Prose>
      </RefSection>

      <RefSection
        id="naming"
        title="Decoding peptide names"
        note="The suffixes and modifiers in these names are not decoration — each one tells you something specific about the molecule."
      >
        <DataTable
          headers={["What you see", "What it tells you", "Example"]}
          minWidth="34rem"
          rows={[
            [
              "Acetate",
              "The salt form the peptide is stabilised as. Standard for manufacturing; it slightly reduces the peptide content by mass but does not change activity.",
              "Oxytocin Acetate",
            ],
            [
              "-tide",
              "Marks the compound as a peptide drug by international naming convention.",
              "Semaglutide, Tirzepatide",
            ],
            [
              "-relin",
              "Stimulates release of a pituitary hormone.",
              "Sermorelin, Ipamorelin",
            ],
            [
              "PEG-",
              "Polyethylene glycol attached, dramatically extending how long it survives in the body.",
              "PEG-MGF",
            ],
            [
              "with / without DAC",
              "A Drug Affinity Complex binds the peptide to blood albumin, stretching its action from ~30 minutes to about a week.",
              "CJC-1295",
            ],
            [
              "LR3",
              "Long R3: extra amino acids plus a substitution that stops it binding to carrier proteins, making it far more potent.",
              "IGF-1 LR3",
            ],
            [
              "Numbers in a name",
              "Usually the amino acid positions the fragment covers, or a development code.",
              "hGH 176-191, BPC-157",
            ],
            [
              "Agonist",
              <>
                Activates a receptor. An <em>antagonist</em> blocks it; a{" "}
                <em>dual</em> or <em>triple</em> agonist activates two or three
                receptor types.
              </>,
              "GLP-1 receptor agonist",
            ],
          ]}
        />
      </RefSection>

      <RefSection
        id="halflife"
        title="Why half-life drives everything"
        note="Half-life is the time it takes for half the compound to clear the body. It is the single number that explains why some of these are taken weekly and others several times a day."
      >
        <Prose>
          Natural peptides are built to be destroyed quickly — that is how
          signalling works, since a signal that never switches off is not a
          signal. Native GnRH lasts two to ten minutes. MGF lasts minutes. This is
          precisely why so much peptide chemistry is devoted to slowing that
          clearance down: the amino acid substitutions in CJC-1295, the
          albumin-binding tail in the DAC version, the PEG chain on PEG-MGF, and
          the fatty acid chain on semaglutide all exist for the same reason.
        </Prose>
        <Prose>
          A useful rule: a compound is largely cleared after roughly four to five
          half-lives. Semaglutide&apos;s week-long half-life means it takes over a
          month to reach a steady level in the body — which is why label dose
          escalation happens at four-week intervals rather than weekly, and why
          side effects can appear well after a dose change.
        </Prose>
        <DataTable
          headers={["Half-life", "What that implies", "Examples here"]}
          minWidth="34rem"
          rows={[
            [
              "Minutes",
              "Effect is a brief pulse; timing relative to meals or sleep matters more than total amount",
              "Gonadorelin, MGF, native GHRH",
            ],
            [
              "Under an hour",
              "Typically dosed one to three times daily in study protocols",
              "Sermorelin, GHRP-2, GHRP-6, Semax",
            ],
            [
              "A few hours",
              "Daily dosing; more even coverage",
              "Ipamorelin, PT-141, Thymosin Alpha-1",
            ],
            [
              "A day or more",
              "Daily or every-other-day, accumulates between doses",
              "IGF-1 LR3, HCG",
            ],
            [
              "About a week",
              "Weekly dosing; steady state takes a month or more to reach",
              "Semaglutide, Tirzepatide, CJC-1295 with DAC",
            ],
          ]}
        />
      </RefSection>

      <RefSection
        id="quality"
        title="Purity, testing, and reading a certificate of analysis"
        note="Research-grade material is not manufactured to pharmaceutical standards, so the certificate of analysis is the only real window into what a vial contains. Independent testing of this market has repeatedly found products that were underdosed, mislabelled, or impure."
      >
        <DataTable
          headers={["Test", "What it answers", "What to look for"]}
          minWidth="36rem"
          emphasizeFirst
          rows={[
            [
              <>
                HPLC
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  High-performance liquid chromatography
                </span>
              </>,
              "How pure is it? Separates the target peptide from fragments and by-products.",
              "A purity percentage, usually ≥98%. The chromatogram should show one dominant peak, not several comparable ones.",
            ],
            [
              <>
                Mass spectrometry
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  MS / LC-MS
                </span>
              </>,
              "Is it actually the right molecule? Measures molecular weight.",
              "Observed mass matching the theoretical mass for that sequence. This is the identity check — purity alone cannot tell you the vial holds the right compound.",
            ],
            [
              "Peptide content",
              "How much of the vial's mass is peptide rather than salt and water?",
              "Often 70–85%. A vial labelled 10 mg net peptide differs from 10 mg gross weight, which affects real concentration.",
            ],
            [
              <>
                Water content
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Karl Fischer
                </span>
              </>,
              "How much residual moisture remains after freeze-drying?",
              "Lower is better for stability — moisture is what degrades dry powder.",
            ],
            [
              "Endotoxin / bioburden",
              "Is it microbiologically clean?",
              "Frequently absent from research-grade certificates, which is itself worth noting.",
            ],
          ]}
        />
        <Callout>
          <span className="font-semibold">
            A certificate is only as good as its provenance.
          </span>{" "}
          A meaningful certificate names the specific batch or lot, is dated, and
          comes from a third-party laboratory rather than the seller. A generic
          certificate with no lot number tells you nothing about the vial in your
          hand, and the peptide content figure is the one most often omitted — yet
          it is the one that determines whether the concentration math is
          actually right.
        </Callout>
      </RefSection>

      <RefSection
        id="mistakes"
        title="The mistakes that come up most"
        note="Nearly all of these are avoidable, and most of them destroy the product rather than merely reducing it."
      >
        <NumberedSteps
          steps={[
            <>
              <span className="font-medium">
                Spraying solvent directly onto the powder.
              </span>{" "}
              The mechanical force breaks the molecule apart. Always run the
              liquid down the vial wall.
            </>,
            <>
              <span className="font-medium">Shaking to dissolve.</span> Foam is
              visible evidence of denaturation. Peptides dissolve on their own; if
              they need help, roll the vial gently.
            </>,
            <>
              <span className="font-medium">Freezing a mixed vial.</span> Ice
              crystals tear peptides apart. Dry powder freezes well; solutions do
              not.
            </>,
            <>
              <span className="font-medium">Confusing mg with mcg.</span> A
              thousandfold error. Working consistently in micrograms per syringe
              unit avoids it entirely.
            </>,
            <>
              <span className="font-medium">Assuming IU converts to mg.</span> It
              does not, and no general formula exists. HCG and HMG stay in IU
              throughout.
            </>,
            <>
              <span className="font-medium">Over-diluting a small vial.</span>{" "}
              Putting a 2 mg vial in 5 mL leaves amounts down at one or two
              syringe units, where the smallest plunger error becomes a large
              proportional one.
            </>,
            <>
              <span className="font-medium">
                Using plain water for peptides that need acid.
              </span>{" "}
              IGF-1 LR3 and some GHRH analogs will not fully dissolve in neutral
              solution; persistent particles are the sign.
            </>,
            <>
              <span className="font-medium">Leaving vials in light.</span> The
              copper peptides, NAD+, glutathione, and several neuropeptides
              degrade in ordinary room light.
            </>,
            <>
              <span className="font-medium">Reusing needles and syringes.</span>{" "}
              Needles dull immediately and sterility is lost after a single use.
            </>,
            <>
              <span className="font-medium">
                Trusting a label over a certificate.
              </span>{" "}
              Printed strength is a claim; a lot-specific certificate is evidence.
            </>,
          ]}
        />
      </RefSection>

      <RefSection
        id="glossary"
        title="Glossary"
        note="The terms that recur throughout this library and across the wider literature."
      >
        <DataTable
          headers={["Term", "Meaning"]}
          rows={[
            [
              "Lyophilized",
              "Freeze-dried. Water is removed under vacuum from a frozen state, leaving a stable powder that can be shipped and stored.",
            ],
            [
              "Reconstitution",
              "Adding liquid to return freeze-dried powder to solution.",
            ],
            [
              "Bacteriostatic",
              "Inhibits bacterial growth without killing existing organisms. Not the same as sterile.",
            ],
            [
              "Subcutaneous (SC)",
              "Into the fat layer beneath the skin. Slower, steadier absorption; the route used for most peptides.",
            ],
            [
              "Intramuscular (IM)",
              "Into muscle tissue. Faster absorption and a larger volume capacity than subcutaneous.",
            ],
            ["Half-life", "The time for half the compound to be cleared from the body."],
            [
              "Receptor",
              "A protein a compound binds to in order to produce an effect. Agonists activate it; antagonists block it.",
            ],
            [
              "Analog",
              "A modified version of a natural molecule, usually altered to last longer or bind more selectively.",
            ],
            [
              "Secretagogue",
              "A substance that causes something else to be secreted — the GHRPs are growth hormone secretagogues.",
            ],
            [
              "Peptide content",
              "The proportion of a vial's mass that is actual peptide rather than counter-ions and residual water.",
            ],
            [
              "Denaturation",
              "Loss of a molecule's three-dimensional shape, and with it its function. Caused by heat, agitation, and freeze–thaw cycles.",
            ],
            [
              "Steady state",
              "The point at which intake and clearance balance and levels stop rising — roughly four to five half-lives.",
            ],
            [
              "GRAS",
              "Generally Recognized As Safe — a US food-ingredient status, which is not drug approval.",
            ],
            [
              "COA",
              "Certificate of analysis: the laboratory report accompanying a specific production lot.",
            ],
            [
              "Off-label",
              "Use of an approved drug for a purpose other than the one it was approved for.",
            ],
          ]}
        />
      </RefSection>

      <footer className="max-w-prose border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        This library is provided for educational and informational purposes only.
        It is not medical advice, and nothing here is a recommendation to use any
        compound described. Dose information is a summary of published regulatory
        labels, clinical trial protocols, and preclinical research literature,
        compiled for reference. Most compounds described are not approved for
        human use, and their safety and efficacy in humans have not been
        established. Anyone considering the use of any peptide, hormone, or
        supplement should consult a qualified healthcare professional.
      </footer>
    </div>
  );
}
