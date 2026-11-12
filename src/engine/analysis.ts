import { FY } from '../config/fy2026-27'
import { takeHome } from './takeHome'
import { calculateTax, type TaxInputs } from './tax'

export interface ReliefBand {
  start: number
  end: number
}

export function reliefBand(): ReliefBand {
  const nextSlab = FY.slabs.find((slab) => slab.upto > FY.rebate.limit)
  const marginalRate = nextSlab?.rate ?? 0
  const start = FY.rebate.limit + FY.standardDeduction
  const end =
    marginalRate < 1
      ? start + FY.rebate.max / (1 - marginalRate)
      : start
  return { start, end }
}

export function sweep(
  from: number,
  to: number,
  points: number,
  inputs: TaxInputs,
): Array<{ gross: number; tax: number; annualTakeHome: number; marginalRate: number }> {
  const count = Math.max(2, Math.floor(points))
  const step = (to - from) / (count - 1)
  return Array.from({ length: count }, (_, index) => {
    const gross = from + step * index
    const currentInputs = { ...inputs, gross }
    const result = calculateTax(currentInputs)
    const next = calculateTax({ ...currentInputs, gross: gross + 100 })
    return {
      gross,
      tax: result.total,
      annualTakeHome: takeHome(currentInputs, result).salaryAnnual,
      marginalRate: (next.total - result.total) / 100,
    }
  })
}
