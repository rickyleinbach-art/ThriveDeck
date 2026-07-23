import {
  PEPTIDE_CATEGORY_LABELS,
  type PeptideCategory,
} from "@/lib/validations/onboarding";

// Curated, category-grouped list of commonly tracked peptides, offered in the
// onboarding wizard as a data-entry convenience — the user selects what they
// are ALREADY using (from their provider), exactly like the shared food
// catalog. Names only: ThriveDeck records what the user enters and NEVER
// suggests compounds or dosing (CLAUDE.md § Health & safety rules). The wizard
// shows the record-only medical disclaimer alongside this list.
export const PEPTIDE_CATALOG: Record<PeptideCategory, string[]> = {
  RECOVERY: ["BPC-157", "TB-500", "GHK-Cu", "KPV", "Thymosin Alpha-1"],
  PERFORMANCE: [
    "Ipamorelin",
    "CJC-1295",
    "Sermorelin",
    "Tesamorelin",
    "GHRP-2",
    "GHRP-6",
    "IGF-1 LR3",
    "MK-677",
  ],
  WEIGHT_MGMT: [
    "Semaglutide",
    "Tirzepatide",
    "Retatrutide",
    "Liraglutide",
    "AOD-9604",
    "Cagrilintide",
  ],
  LONGEVITY: ["Epithalon", "MOTS-c", "NAD+", "Thymalin", "SS-31", "Humanin"],
  OTHER: ["PT-141", "Melanotan II", "Selank", "Semax", "DSIP"],
};

export interface PeptideCatalogEntry {
  name: string;
  category: PeptideCategory;
  categoryLabel: string;
}

// Flat list for search / rendering, tagged with its category.
export const PEPTIDE_CATALOG_ENTRIES: PeptideCatalogEntry[] = (
  Object.entries(PEPTIDE_CATALOG) as [PeptideCategory, string[]][]
).flatMap(([category, names]) =>
  names.map((name) => ({
    name,
    category,
    categoryLabel: PEPTIDE_CATEGORY_LABELS[category],
  }))
);
