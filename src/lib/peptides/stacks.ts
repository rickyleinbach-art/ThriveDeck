// Pairings people actually run, and the combinations worth steering clear of.
//
// Both halves are opinion-bearing in a way the compound entries are not: a
// pairing is "common", a warning is "don't". The rationale is written out so
// the reader can judge it, and every warning names the mechanism rather than
// just the verdict.

export type StackGoal = "recovery" | "hormone" | "metabolic" | "nootropic";

export const STACK_GOAL_LABELS: Record<StackGoal, string> = {
  recovery: "Recovery",
  hormone: "Hormone",
  metabolic: "Metabolic",
  nootropic: "Nootropic",
};

export type StackLevel = "beginner" | "intermediate" | "advanced";

export const STACK_LEVEL_LABELS: Record<StackLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export interface PeptideStack {
  id: string;
  name: string;
  /** Reference library slugs, in display order. */
  slugs: string[];
  goal: StackGoal;
  level: StackLevel;
  purpose: string;
  /** Why these two, mechanistically. */
  why: string;
  /** Practicalities: timing, whether they share a vial, what to watch. */
  howItIsRun: string;
}

export const PEPTIDE_STACKS: PeptideStack[] = [
  {
    id: "bpc-tb",
    name: "BPC-157 + TB-500",
    slugs: ["bpc-157", "tb-500"],
    goal: "recovery",
    level: "beginner",
    purpose: "Recovery and soft-tissue healing",
    why: "They act on different parts of the same job. BPC-157's animal data centres on blood-vessel growth and growth-factor signalling at the injury; TB-500 (a thymosin β4 fragment) drives cell migration and actin remodelling. Pairing them is the logic behind the most common blended vial on the market.",
    howItIsRun: "Often sold pre-blended at equal mass, mixed in one vial and drawn together. Separately, BPC-157 is usually daily and TB-500 a few times a week, so the blend forces BPC's schedule onto both.",
  },
  {
    id: "cjc-ipa",
    name: "CJC-1295 + Ipamorelin",
    slugs: ["cjc-1295-without-dac", "ipamorelin"],
    goal: "hormone",
    level: "intermediate",
    purpose: "Growth hormone pulse",
    why: "A GHRH analogue and a GHRP hit two different pituitary receptors, and together they release more GH than either alone — the combination is close to additive. Ipamorelin is the usual GHRP partner because it does not raise cortisol or prolactin the way GHRP-6 and hexarelin do.",
    howItIsRun: "The no-DAC version of CJC-1295 is the one to pair here, so the pulse stays pulsatile. Typically taken together before bed, on an empty stomach, since food blunts the GH response.",
  },
  {
    id: "sermorelin-ipa",
    name: "Sermorelin + Ipamorelin",
    slugs: ["sermorelin", "ipamorelin"],
    goal: "hormone",
    level: "beginner",
    purpose: "GH support with the mildest GHRH",
    why: "The same GHRH-plus-GHRP logic as CJC-1295 + ipamorelin, with sermorelin standing in as the shorter-acting, longest-studied GHRH analogue. The pulse is smaller and the safety record is longer.",
    howItIsRun: "Both are short-lived, so they are taken together at night. Sermorelin was an approved prescription product for years, which is the main reason this version is the conservative starting point.",
  },
  {
    id: "tesamorelin-ipa",
    name: "Tesamorelin + Ipamorelin",
    slugs: ["tesamorelin", "ipamorelin"],
    goal: "metabolic",
    level: "advanced",
    purpose: "Visceral fat and GH",
    why: "Tesamorelin is the GHRH analogue with real human fat-loss data — it is approved for reducing visceral fat in HIV lipodystrophy — and ipamorelin adds the GHRP side of the pulse. The pairing targets the abdominal fat effect specifically.",
    howItIsRun: "Tesamorelin is the expensive, approved half and is dosed daily per its label; ipamorelin rides along at night. IGF-1 should be watched when two GH stimulators run together.",
  },
  {
    id: "cagrisema",
    name: "Semaglutide + Cagrilintide",
    slugs: ["semaglutide", "cagrilintide"],
    goal: "metabolic",
    level: "advanced",
    purpose: "Weight loss beyond a GLP-1 alone",
    why: "A GLP-1 agonist and an amylin analogue work through separate satiety pathways. Novo's CagriSema programme pairs them deliberately, and Phase 3 showed more weight loss than semaglutide on its own.",
    howItIsRun: "Both are weekly and are co-formulated in the trial product. Outside a trial the two are mixed separately and injected at the same sitting. Nausea stacks, so titration is slower than for either alone.",
  },
  {
    id: "ghk-bpc",
    name: "GHK-Cu + BPC-157",
    slugs: ["ghk-cu", "bpc-157"],
    goal: "recovery",
    level: "intermediate",
    purpose: "Skin and tissue repair",
    why: "GHK-Cu drives collagen synthesis and has an anti-inflammatory signature in skin; BPC-157 brings the vascular and growth-factor side. The pairing shows up in the three- and four-way blended repair vials.",
    howItIsRun: "GHK-Cu is light-sensitive and gives the mixed vial a blue tint, so a blend inherits the need for an opaque or wrapped vial. Copper can sting at the injection site.",
  },
  {
    id: "pt141-bpc",
    name: "PT-141 + BPC-157",
    slugs: ["pt-141", "bpc-157"],
    goal: "hormone",
    level: "intermediate",
    purpose: "Sexual health",
    why: "A loose pairing rather than a mechanistic one: PT-141 acts centrally on melanocortin receptors for arousal, and BPC-157 is included for general vascular and tissue support. There is no study of the combination.",
    howItIsRun: "PT-141 is taken as needed, an hour or two ahead; BPC-157 is a daily background. They are not mixed in one vial.",
  },
  {
    id: "selank-semax",
    name: "Selank + Semax",
    slugs: ["selank", "semax"],
    goal: "nootropic",
    level: "beginner",
    purpose: "Focus and mood",
    why: "Both are Russian nasal peptides with overlapping but distinct profiles: semax leans towards attention and BDNF, selank towards anxiety and GABA tone. Together they cover the stimulating and the calming side.",
    howItIsRun: "Both are intranasal, so there is no mixing at all — alternate nostrils, a few minutes apart. Morning for semax; selank whenever anxiety is the target.",
  },
];

export type WarningLevel = "high" | "caution";

export const WARNING_LEVEL_LABELS: Record<WarningLevel, string> = {
  high: "High risk",
  caution: "Caution",
};

export interface StackWarning {
  id: string;
  title: string;
  /** What is being combined. Library slugs where one exists; plain text otherwise. */
  parties: { label: string; slug?: string }[];
  level: WarningLevel;
  /** The mechanism, so the reader can extend the reasoning to cases not listed. */
  why: string;
}

export const STACK_WARNINGS: StackWarning[] = [
  {
    id: "glp1-stacking",
    title: "Two GLP-1 agonists at once",
    parties: [
      { label: "Semaglutide", slug: "semaglutide" },
      { label: "Tirzepatide", slug: "tirzepatide" },
      { label: "Retatrutide", slug: "retatrutide" },
      { label: "Orforglipron", slug: "orforglipron" },
    ],
    level: "high",
    why: "They hit the same receptor. Stacking gives no extra benefit and compounds the side effects — severe nausea, vomiting, dehydration — and pancreatitis risk rises with the total load. This includes the oral one: orforglipron on top of an injectable is still two GLP-1 agonists.",
  },
  {
    id: "glp1-insulin",
    title: "A GLP-1 agonist with insulin, unsupervised",
    parties: [
      { label: "Any GLP-1 agonist" },
      { label: "Insulin" },
    ],
    level: "high",
    why: "GLP-1 agonists already push insulin release and slow the stomach. Adding injected insulin without reducing its dose risks hypoglycaemia severe enough to be dangerous. The combination is standard in type 2 diabetes — under a prescriber who has adjusted the insulin.",
  },
  {
    id: "dac-ghrp",
    title: "CJC-1295 with DAC plus a frequent GHRP",
    parties: [
      { label: "CJC-1295 with DAC", slug: "cjc-1295-with-dac" },
      { label: "Ipamorelin", slug: "ipamorelin" },
    ],
    level: "caution",
    why: "The DAC version lasts about a week and holds GH stimulation up continuously. Layering repeated GHRP pulses on top of that invites receptor desensitisation and flattens the natural pulsatile pattern. Pair GHRPs with the no-DAC version instead.",
  },
  {
    id: "gh-cancer",
    title: "Any GH stimulator with an active cancer",
    parties: [
      { label: "GHRH analogues and GHRPs" },
      { label: "MK-677", slug: "mk-677" },
      { label: "HGH", slug: "hgh" },
    ],
    level: "high",
    why: "Growth hormone drives IGF-1, and IGF-1 is a proliferation signal that many tumours respond to. Every approved GH product carries this contraindication, and it applies equally to the secretagogues that raise GH indirectly. A history of hormone-sensitive cancer counts.",
  },
  {
    id: "pt141-pde5",
    title: "PT-141 with a PDE5 inhibitor",
    parties: [
      { label: "PT-141", slug: "pt-141" },
      { label: "Sildenafil / tadalafil" },
    ],
    level: "caution",
    why: "Both lower blood pressure by different routes. Together the drop can be large enough to cause dizziness or fainting, and the cardiovascular strain adds up. Spacing them apart in time is the usual workaround; taking them together is not.",
  },
  {
    id: "two-melanocortins",
    title: "Two melanocortin agonists on the same day",
    parties: [
      { label: "Melanotan II", slug: "melanotan-ii" },
      { label: "PT-141", slug: "pt-141" },
    ],
    level: "caution",
    why: "PT-141 is a metabolite of melanotan II, and they activate the same receptors. Combining them amplifies the shared side effects — nausea, flushing, blood-pressure rise, spontaneous erections — well beyond either alone.",
  },
  {
    id: "mk677-glucose",
    title: "MK-677 with poor glucose control",
    parties: [
      { label: "MK-677", slug: "mk-677" },
      { label: "Insulin resistance or diabetes" },
    ],
    level: "caution",
    why: "MK-677 reliably raises fasting glucose and insulin. On top of existing insulin resistance that is a step in the wrong direction, and it partly undoes what a GLP-1 agonist is trying to do if both are being run.",
  },
];
