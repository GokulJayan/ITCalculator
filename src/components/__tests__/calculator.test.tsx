import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InputPanel } from '../InputPanel'
import { ReliefNotice } from '../ReliefNotice'
import { calculateTax } from '../../engine/tax'
import { takeHome } from '../../engine/takeHome'
import { defaultInputs } from '../../state/useInputs'
import { ResultSummary, TakeHomeCard } from '../Results'

afterEach(cleanup)

describe('calculator inputs and relief notice', () => {
  it('parses shorthand salary input such as 12L', () => {
    const onChange = vi.fn()
    render(<InputPanel inputs={defaultInputs} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Annual Fixed salary'), {
      target: { value: '12L' },
    })

    expect(onChange).toHaveBeenLastCalledWith({ gross: 1_200_000 })
  })

  it('accepts separate taxable income components', () => {
    const onChange = vi.fn()
    render(<InputPanel inputs={defaultInputs} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Annual referral bonus'), {
      target: { value: '25,000' },
    })

    expect(onChange).toHaveBeenLastCalledWith({ referralBonus: 25_000 })
    expect(screen.getByLabelText('Annual stock income')).toBeInTheDocument()
    expect(screen.getByLabelText('Annual bonus')).toBeInTheDocument()
    expect(screen.getByLabelText('Annual dividend income')).toBeInTheDocument()
  })

  it('shows total income, tax, and salary-only take-home for the selected period', () => {
    const inputs = { ...defaultInputs, bonus: 120_000 }
    const result = calculateTax(inputs)
    render(<TakeHomeCard inputs={inputs} result={result} takeHome={takeHome(inputs, result)} />)

    expect(screen.getByText('Bonus')).toBeInTheDocument()
    expect(screen.getByText('Before tax')).toBeInTheDocument()
    expect(screen.getByText('Allocated tax')).toBeInTheDocument()
    expect(screen.getByText('After tax')).toBeInTheDocument()
    expect(screen.getByText('Total income / year')).toBeInTheDocument()
    expect(screen.getByText('Total income tax / year')).toBeInTheDocument()
    expect(screen.getByText('Net income after tax / year')).toBeInTheDocument()
    expect(screen.getByText('Salary in-hand / year (fixed salary only)')).toBeInTheDocument()
    expect(screen.getByLabelText(/total income minus .* total income tax equals .*/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(screen.getByText('Total income / month')).toBeInTheDocument()
    expect(screen.getByText('Total income tax / month')).toBeInTheDocument()
    expect(screen.getByText('Net income after tax / month')).toBeInTheDocument()
    expect(screen.getByText('Salary in-hand / month (fixed salary only)')).toBeInTheDocument()
    expect(screen.queryByText('Before tax')).not.toBeInTheDocument()
  })

  it('shows total income and total tax in the summary', () => {
    const inputs = { ...defaultInputs, gross: 1_500_000, bonus: 200_000 }
    const result = calculateTax(inputs)
    const home = takeHome(inputs, result)
    render(<ResultSummary inputs={inputs} result={result} takeHome={home} />)

    expect(screen.getByText('TOTAL ANNUAL INCOME')).toBeInTheDocument()
    expect(screen.getByText('NET INCOME AFTER TAX')).toBeInTheDocument()
    expect(screen.getByText('TOTAL ANNUAL TAX')).toBeInTheDocument()
    expect(screen.getByText('Fixed salary and all additional components')).toBeInTheDocument()
    expect(screen.getByText('Total annual income − total annual tax')).toBeInTheDocument()
    expect(screen.getByText('TOTAL ANNUAL INCOME').closest('.summary-card')).toHaveClass('summary-income')
    expect(screen.getByText('TOTAL ANNUAL TAX').closest('.summary-card')).toHaveClass('summary-tax')
    expect(screen.getByText('NET INCOME AFTER TAX').closest('.summary-card')).toHaveClass('summary-net')
    expect(screen.getByText('₹17 L')).toBeInTheDocument()
    expect(screen.getByText('₹15.7 L')).toBeInTheDocument()
    expect(screen.getByText('₹1,30,000')).toBeInTheDocument()
  })

  it('shows the relief notice only while marginal relief applies', () => {
    const { rerender } = render(
      <ReliefNotice result={calculateTax({ ...defaultInputs, gross: 1_280_000 })} />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(
      <ReliefNotice result={calculateTax({ ...defaultInputs, gross: 1_500_000 })} />,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
