export const FY = {
  label: 'FY 2026-27',
  assessmentYear: 'AY 2027–28',
  slabs: [
    { upto: 400_000, rate: 0 },
    { upto: 800_000, rate: 0.05 },
    { upto: 1_200_000, rate: 0.1 },
    { upto: 1_600_000, rate: 0.15 },
    { upto: 2_000_000, rate: 0.2 },
    { upto: 2_400_000, rate: 0.25 },
    { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
  ],
  standardDeduction: 75_000,
  rebate: { limit: 1_200_000, max: 60_000 },
  familyPensionDeductionLimit: 25_000,
  cess: 0.04,
  surcharge: [
    { above: 5_000_000, rate: 0.1 },
    { above: 10_000_000, rate: 0.15 },
    { above: 20_000_000, rate: 0.25 },
  ],
} as const

export type TaxSlab = (typeof FY.slabs)[number]
