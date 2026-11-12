import { FY } from '../config/fy2026-27'

export interface TaxInputs {
  gross: number
  basic: number
  basicMatchesGross: boolean
  otherIncome: number
  stocks: number
  bonus: number
  referralBonus: number
  dividend: number
  employerNps: number
  familyPension: number
  salaried: boolean
  nri: boolean
  customPT: number
  pfOn: boolean
  pfRate: number
}

export interface SlabRow {
  from: number
  to: number
  rate: number
  taxable: number
  tax: number
  cumulativeTax: number
}

export interface TaxResult {
  taxable: number
  rows: SlabRow[]
  base: number
  rebate: number
  rebateRelief: number
  surcharge: number
  surchargeRelief: number
  cess: number
  total: number
  marginalRate: number
}

export function slabTax(
  income: number,
  slabs: readonly { upto: number; rate: number }[] = FY.slabs,
): { tax: number; rows: SlabRow[] } {
  let lower = 0
  let tax = 0
  const rows: SlabRow[] = []
  const taxableIncome = Math.max(0, income)

  for (const { upto, rate } of slabs) {
    if (taxableIncome <= lower) break
    const upper = Math.min(taxableIncome, upto)
    const taxable = upper - lower
    const slabAmount = taxable * rate
    tax += slabAmount
    rows.push({
      from: lower,
      to: upper,
      rate,
      taxable,
      tax: slabAmount,
      cumulativeTax: tax,
    })
    lower = upto
  }

  return { tax, rows }
}

function taxBeforeSurcharge(taxable: number, nri: boolean): number {
  const base = slabTax(taxable).tax
  if (nri) return base
  if (taxable <= FY.rebate.limit) return Math.max(0, base - FY.rebate.max)
  return Math.min(base, taxable - FY.rebate.limit)
}

function surchargeMarginalRelief(
  taxable: number,
  taxBeforeSurchargeAmount: number,
  surchargeRate: number,
): number {
  const tier = [...FY.surcharge]
    .reverse()
    .find((candidate) => taxable > candidate.above)
  if (!tier) return 0

  const taxAtThreshold = slabTax(tier.above).tax
  const lowerTier = [...FY.surcharge]
    .reverse()
    .find((candidate) => candidate.above < tier.above)
  const lowerSurchargeRate =
    lowerTier && tier.above > lowerTier.above ? lowerTier.rate : 0
  const thresholdTaxWithSurcharge = taxAtThreshold * (1 + lowerSurchargeRate)
  const incomeExcess = taxable - tier.above
  const taxWithSurcharge = taxBeforeSurchargeAmount * (1 + surchargeRate)
  return Math.max(0, taxWithSurcharge - thresholdTaxWithSurcharge - incomeExcess)
}

export function calculateTax(inputs: TaxInputs): TaxResult {
  const standardDeduction = inputs.salaried ? FY.standardDeduction : 0
  const pensionDeduction = Math.min(
    Math.max(0, inputs.familyPension) / 3,
    FY.familyPensionDeductionLimit,
  )
  const taxable = Math.max(
    0,
    inputs.gross +
      inputs.otherIncome +
      inputs.stocks +
      inputs.bonus +
      inputs.referralBonus +
      inputs.dividend -
      standardDeduction -
      inputs.employerNps -
      pensionDeduction,
  )
  const { tax: base, rows } = slabTax(taxable)

  let tax = base
  let rebate = 0
  let rebateRelief = 0
  if (!inputs.nri) {
    if (taxable <= FY.rebate.limit) {
      rebate = Math.min(base, FY.rebate.max)
      tax = base - rebate
    } else {
      const cap = taxable - FY.rebate.limit
      tax = Math.min(base, cap)
      rebateRelief = base - tax
    }
  }

  const surchargeTier = [...FY.surcharge]
    .reverse()
    .find((tier) => taxable > tier.above)
  const surchargeRate = surchargeTier?.rate ?? 0
  const surchargeBeforeRelief = tax * surchargeRate
  const surchargeRelief = surchargeMarginalRelief(taxable, tax, surchargeRate)
  const surcharge = Math.max(0, surchargeBeforeRelief - surchargeRelief)
  const cess = (tax + surcharge) * FY.cess
  const total = tax + surcharge + cess

  const nextRupee = calculateTaxMarginal(taxable, inputs.nri)
  return {
    taxable,
    rows,
    base,
    rebate,
    rebateRelief,
    surcharge,
    surchargeRelief,
    cess,
    total,
    marginalRate: nextRupee,
  }
}

function calculateTaxMarginal(taxable: number, nri: boolean): number {
  const delta = 100
  return (
    (taxWithoutCess(taxable + delta, nri) -
      taxWithoutCess(taxable, nri)) *
    (1 + FY.cess)
  ) / delta
}

function taxWithoutCess(taxable: number, nri: boolean): number {
  let tax = taxBeforeSurcharge(taxable, nri)
  const tier = [...FY.surcharge]
    .reverse()
    .find((candidate) => taxable > candidate.above)
  if (tier) {
    tax = Math.max(
      0,
      tax * (1 + tier.rate) -
        surchargeMarginalRelief(taxable, tax, tier.rate),
    )
  }
  return tax
}
