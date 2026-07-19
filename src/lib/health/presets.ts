// Common lab panels from the PRD, offered as prefills for the lab form.
// Names/units only — reference ranges come from the user's own report.

export interface LabPreset {
  name: string;
  unit: string;
}

export const LAB_PRESETS: LabPreset[] = [
  { name: "A1C", unit: "%" },
  { name: "Fasting glucose", unit: "mg/dL" },
  { name: "Total cholesterol", unit: "mg/dL" },
  { name: "LDL cholesterol", unit: "mg/dL" },
  { name: "HDL cholesterol", unit: "mg/dL" },
  { name: "Triglycerides", unit: "mg/dL" },
  { name: "Testosterone (total)", unit: "ng/dL" },
  { name: "Vitamin D (25-OH)", unit: "ng/mL" },
];
