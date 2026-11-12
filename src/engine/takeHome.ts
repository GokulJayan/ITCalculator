import { calculateTax } from './tax'
import type { TaxInputs, TaxResult } from './tax'

export interface IncomeComponent {
  label: string
  amount: number
  tax: number
  afterTax: number
}

export interface TakeHomeResult {
  pf: number
  pt: number
  salaryAnnual: number
  salaryMonthly: number
  salaryTax: number
  componentTax: number
  components: IncomeComponent[]
  totalIncome: number
  totalTax: number
  totalAfterTax: number
}

export function takeHome(inputs: TaxInputs, result: TaxResult): TakeHomeResult {
  const pf = inputs.pfOn ? (inputs.basic * inputs.pfRate) / 2 : 0
  const pt = Math.max(0, inputs.customPT)
  const salaryOnlyInputs = {
    ...inputs,
    otherIncome: 0,
    stocks: 0,
    bonus: 0,
    referralBonus: 0,
    dividend: 0,
  }
  const salaryTax = calculateTax(salaryOnlyInputs).total
  const componentTax = Math.max(0, result.total - salaryTax)
  const componentValues = [
    { label: 'Other taxable income', amount: Math.max(0, inputs.otherIncome) },
    { label: 'Stocks', amount: Math.max(0, inputs.stocks) },
    { label: 'Bonus', amount: Math.max(0, inputs.bonus) },
    { label: 'Referral bonus', amount: Math.max(0, inputs.referralBonus) },
    { label: 'Dividend', amount: Math.max(0, inputs.dividend) },
  ]
  const totalComponents = componentValues.reduce((sum, component) => sum + component.amount, 0)
  const components = componentValues.map(({ label, amount }) => {
    const tax = totalComponents > 0 ? (componentTax * amount) / totalComponents : 0
    return { label, amount, tax, afterTax: amount - tax }
  })
  const totalIncome = inputs.gross + totalComponents
  const salaryAnnual = Math.max(
    0,
    inputs.gross - salaryTax - pf - pt,
  )
  const totalAfterTax = totalIncome - result.total
  return {
    pf,
    pt,
    salaryAnnual,
    salaryMonthly: salaryAnnual / 12,
    salaryTax,
    componentTax,
    components,
    totalIncome,
    totalTax: result.total,
    totalAfterTax,
  }
}
