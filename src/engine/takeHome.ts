import type { TaxInputs, TaxResult } from './tax'

export interface TakeHomeResult {
  pf: number
  pt: number
  annual: number
  monthly: number
  monthlyTax: number
}

export function takeHome(inputs: TaxInputs, result: TaxResult): TakeHomeResult {
  const pf = inputs.pfOn ? (inputs.basic * inputs.pfRate) / 2 : 0
  const pt = Math.max(0, inputs.customPT)
  const annual = Math.max(
    0,
    inputs.gross + inputs.otherIncome - result.total - pf - pt,
  )
  return {
    pf,
    pt,
    annual,
    monthly: annual / 12,
    monthlyTax: result.total / 12,
  }
}
