import { describe, expect, it } from 'vitest'
import { calculateTax } from '../tax'
import { takeHome } from '../takeHome'
import { defaultInputs } from '../../state/useInputs'

describe('FY 2026-27 new-regime estimate', () => {
  it('calculates the ₹15L salaried example including cess', () => {
    const result = calculateTax({ ...defaultInputs, gross: 1_500_000 })
    expect(result.taxable).toBe(1_425_000)
    expect(result.base).toBe(93_750)
    expect(result.cess).toBe(3_750)
    expect(result.total).toBe(97_500)
  })

  it('includes additional income components in taxable income and total income', () => {
    const inputs = {
      ...defaultInputs,
      stocks: 100_000,
      bonus: 50_000,
      referralBonus: 25_000,
      dividend: 25_000,
    }
    const result = calculateTax(inputs)
    const takeHomeResult = takeHome(inputs, result)
    const salaryOnlyInputs = {
      ...inputs,
      otherIncome: 0,
      stocks: 0,
      bonus: 0,
      referralBonus: 0,
      dividend: 0,
    }
    const salaryOnlyTakeHome = takeHome(salaryOnlyInputs, calculateTax(salaryOnlyInputs))

    expect(result.taxable).toBe(2_125_000)
    expect(takeHomeResult.salaryAnnual).toBe(salaryOnlyTakeHome.salaryAnnual)
    expect(takeHomeResult.totalIncome).toBe(2_200_000)
    expect(takeHomeResult.totalTax).toBe(result.total)
    expect(takeHomeResult.componentTax).toBe(result.total - takeHomeResult.salaryTax)
    expect(takeHomeResult.components.reduce((sum, component) => sum + component.tax, 0))
      .toBeCloseTo(takeHomeResult.componentTax, 8)
    expect(takeHomeResult.totalAfterTax).toBe(takeHomeResult.totalIncome - result.total)
  })

  it('keeps salary in-hand unchanged when a referral bonus is added', () => {
    const salaryInputs = { ...defaultInputs, gross: 1_500_000, basic: 1_500_000 }
    const salaryTax = calculateTax(salaryInputs)
    const salaryTakeHome = takeHome(salaryInputs, salaryTax)

    const bonusInputs = { ...salaryInputs, referralBonus: 200_000 }
    const combinedTax = calculateTax(bonusInputs)
    const combinedTakeHome = takeHome(bonusInputs, combinedTax)

    expect(salaryTakeHome.salaryAnnual).toBe(1_310_100)
    expect(combinedTakeHome.salaryAnnual).toBe(salaryTakeHome.salaryAnnual)
    expect(combinedTakeHome.totalIncome).toBe(1_700_000)
    expect(combinedTakeHome.totalAfterTax).toBe(1_700_000 - combinedTax.total)
    expect(combinedTakeHome.components.find((component) => component.label === 'Referral bonus'))
      .toMatchObject({ amount: 200_000, afterTax: 200_000 - combinedTakeHome.componentTax })
  })

  it('rebates tax at the ₹12.75L gross salary threshold', () => {
    const result = calculateTax({ ...defaultInputs, gross: 1_275_000 })
    expect(result.taxable).toBe(1_200_000)
    expect(result.total).toBe(0)
  })

  it('applies marginal relief above the rebate limit and adds cess', () => {
    const result = calculateTax({ ...defaultInputs, gross: 1_280_000 })
    expect(result.taxable).toBe(1_205_000)
    expect(result.total).toBeCloseTo(5_000, 8)
    expect(result.marginalRate).toBeCloseTo(1, 2)
  })

  it('caps tax including cess at income above the ₹12.75L salary threshold', () => {
    const result = calculateTax({ ...defaultInputs, gross: 1_300_000 })
    expect(result.total).toBeCloseTo(25_000, 8)
  })

  it('does not apply the section 87A rebate to an NRI', () => {
    const result = calculateTax({
      ...defaultInputs,
      gross: 1_280_000,
      nri: true,
    })
    expect(result.total).toBe(63_180)
  })

  it('applies the 10% surcharge tier above ₹50L taxable income', () => {
    const result = calculateTax({ ...defaultInputs, gross: 6_000_000 })
    expect(result.taxable).toBe(5_925_000)
    expect(result.surcharge).toBeGreaterThan(0)
    expect(result.surcharge / (result.base * 0.1)).toBeCloseTo(1, 8)
  })

  it('handles income at or below the standard deduction', () => {
    for (const gross of [0, 1, 75_000]) {
      expect(calculateTax({ ...defaultInputs, gross }).total).toBe(0)
    }
  })

  it('matches notebook tax before cess at representative salaries', () => {
    const salaries = [
      { gross: 1_500_000, taxBeforeCess: 93_750 },
      { gross: 1_280_000, taxBeforeCess: 5_000 / 1.04 },
      { gross: 1_275_000, taxBeforeCess: 0 },
    ]
    for (const sample of salaries) {
      const { cess: _cess, total, ...result } = calculateTax({
        ...defaultInputs,
        gross: sample.gross,
      })
      expect(total - _cess).toBeCloseTo(sample.taxBeforeCess, 8)
      expect(result.taxable).toBeGreaterThanOrEqual(0)
    }
  })

  it('keeps tax non-decreasing and take-home non-negative as salary rises', () => {
    let previousTax = 0
    for (let gross = 0; gross <= 30_000_000; gross += 10_000) {
      const inputs = { ...defaultInputs, gross }
      const result = calculateTax(inputs)
      const net = takeHome(inputs, result)
      expect(result.total).toBeGreaterThanOrEqual(previousTax)
      expect(net.salaryAnnual).toBeGreaterThanOrEqual(0)
      previousTax = result.total
    }
  })
})
