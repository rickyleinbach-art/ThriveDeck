import type { Metadata } from "next";
import { MixingCalculator } from "../mixing-calculator";
import { BlendCalculator } from "../blend-calculator";
import { DataTable, Formula, Prose, RefSection } from "../sections";

export const metadata: Metadata = {
  title: "Calculators · Peptide reference",
};

// The free-form calculators, for when you already know your numbers. The
// guided version on the Reconstitute tab is the one to start with.
export default function CalculatorsPage() {
  return (
    <div className="space-y-10">
      <RefSection
        id="single"
        title="Single vial"
        note="Enter what is on your own vial. Units are insulin-syringe marks: each one holds 0.01 mL, so a 1 mL barrel reads 0–100. Flip the switch to solve for water instead of for the draw."
      >
        <MixingCalculator />
      </RefSection>

      <RefSection
        id="blend"
        title="Blends"
        note="When one vial holds more than one peptide. You pick where to draw to and read off what that delivers of each component."
      >
        <BlendCalculator />
      </RefSection>

      <RefSection
        id="math"
        title="The math, if you would rather do it yourself"
        note="There is really only one relationship to remember, and one conversion on top of it."
      >
        <Formula>concentration = mg in vial ÷ mL of solvent added</Formula>
        <Formula>mcg per unit = (mg in vial × 1000) ÷ (mL added × 100)</Formula>
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
    </div>
  );
}
