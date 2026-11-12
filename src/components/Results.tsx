import { useState } from 'react'
import type { TakeHomeResult } from '../engine/takeHome'
import type { TaxInputs, TaxResult } from '../engine/tax'
import { formatINR, formatINRCompact } from '../utils/formatINR'

interface ResultsProps {
  inputs: TaxInputs
  result: TaxResult
  takeHome: TakeHomeResult
}

export function ResultSummary({ result, takeHome }: ResultsProps) {
  const effectiveRate = result.taxable > 0 ? (result.total / result.taxable) * 100 : 0
  return (
    <section className="summary-grid" aria-label="Tax summary">
      <div className="summary-card summary-income">
        <span className="summary-topline">TOTAL ANNUAL INCOME</span>
        <strong>{formatINRCompact(takeHome.totalIncome)}</strong>
        <span>Fixed salary and all additional components</span>
      </div>

      <div className="summary-card summary-tax">
        <div className="summary-topline">
          <span>TOTAL ANNUAL TAX</span>
          <span className="summary-icon">₹</span>
        </div>
        <strong>{formatINR(result.total)}</strong>
        <span>
          {result.total === 0
            ? 'No tax payable under this estimate'
            : `${effectiveRate.toFixed(2)}% effective rate`}
        </span>
      </div>

      <div className="summary-card summary-net">
        <span className="summary-topline">NET INCOME AFTER TAX</span>
        <strong>{formatINRCompact(takeHome.totalAfterTax)}</strong>
        <span>Total annual income − total annual tax</span>
      </div>
    </section>
  )
}

export function SlabTable({ result }: { result: TaxResult }) {
  return (
    <section className="card content-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">HOW YOUR TAX ADDS UP</span>
          <h2>Tax breakdown</h2>
        </div>
        <span className="soft-tag">New regime</span>
      </div>
      <p className="table-scroll-hint">Swipe horizontally to see all columns</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable tax breakdown table">
        <table>
          <thead>
            <tr>
              <th scope="col">Income band</th>
              <th scope="col">Rate</th>
              <th scope="col">Taxable in band</th>
              <th scope="col">Tax</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={`${row.from}-${row.rate}`}>
                <td>{formatINR(row.from)} – {Number.isFinite(row.to) ? formatINR(row.to) : 'above'}</td>
                <td>{(row.rate * 100).toFixed(0)}%</td>
                <td>{formatINR(row.taxable)}</td>
                <td>{formatINR(row.tax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th colSpan={3}>Tax before rebate</th><td>{formatINR(result.base)}</td></tr>
            {result.rebate > 0 && (
              <tr><th colSpan={3}>Section 87A rebate</th><td className="positive">−{formatINR(result.rebate)}</td></tr>
            )}
            {result.rebateRelief > 0 && (
              <tr><th colSpan={3}>Rebate marginal relief</th><td className="positive">−{formatINR(result.rebateRelief)}</td></tr>
            )}
            {result.surcharge > 0 && (
              <tr><th colSpan={3}>Surcharge</th><td>{formatINR(result.surcharge)}</td></tr>
            )}
            {result.surchargeRelief > 0 && (
              <tr><th colSpan={3}>Surcharge marginal relief</th><td className="positive">−{formatINR(result.surchargeRelief)}</td></tr>
            )}
            <tr><th colSpan={3}>Health & education cess (4%)</th><td>{formatINR(result.cess)}</td></tr>
            <tr className="grand-total"><th colSpan={3}>Total tax estimate</th><td>{formatINR(result.total)}</td></tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

export function TakeHomeCard({ takeHome, inputs }: ResultsProps) {
  const [mode, setMode] = useState<'monthly' | 'yearly'>('yearly')
  const divisor = mode === 'monthly' ? 12 : 1

  const pfValue = takeHome.pf / divisor
  const ptValue = takeHome.pt / divisor
  const totalIncomeValue = takeHome.totalIncome / divisor
  const totalTaxValue = takeHome.totalTax / divisor
  const totalAfterTaxValue = takeHome.totalAfterTax / divisor
  const salaryInHandValue = takeHome.salaryAnnual / divisor

  return (
    <section className="card content-card takehome-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR INCOME & PAYCHEQUE, ESTIMATED</span>
          <h2>Income breakdown</h2>
        </div>
        <div className="section-actions">
          <div className="takehome-toggle" aria-label="Choose take-home period">
            <button type="button" className={mode === 'monthly' ? 'is-active' : ''} onClick={() => setMode('monthly')}>
              Monthly
            </button>
            <button type="button" className={mode === 'yearly' ? 'is-active' : ''} onClick={() => setMode('yearly')}>
              Yearly
            </button>
          </div>
          <button
            className="download-button no-print"
            type="button"
            onClick={() => window.print()}
            aria-label="Print or save summary"
            title="Print or save summary"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 2.5v9m0 0 3.5-3.5M10 11.5 6.5 8M4 13v4h12v-4" />
            </svg>
          </button>
        </div>
      </div>
      <div className="takehome-total">
        <span>{mode === 'monthly' ? 'Total income / month' : 'Total income / year'}</span>
        <strong>{formatINR(totalIncomeValue)}</strong>
      </div>
      <div className="takehome-lines">
        <div className="takehome-earned"><span>{mode === 'monthly' ? 'Total income tax / month' : 'Total income tax / year'}</span><strong className="negative">−{formatINR(totalTaxValue)}</strong></div>
        <div className="takehome-after-tax"><span>{mode === 'monthly' ? 'Total income after tax / month' : 'Total income after tax / year'}</span><strong>{formatINR(totalAfterTaxValue)}</strong></div>
        {mode === 'yearly' && takeHome.components.map(({ label, amount, tax, afterTax }) =>
          amount > 0 ? (
            <div className="income-component" key={label}>
              <strong className="income-component-label">{label}</strong>
              <span><small>Before tax</small><strong>{formatINR(amount)}</strong></span>
              <span><small>Allocated tax</small><strong className="negative">−{formatINR(tax)}</strong></span>
              <span><small>After tax</small><strong>{formatINR(afterTax)}</strong></span>
            </div>
          ) : null,
        )}
        <div><span>Fixed salary</span><strong>{formatINR(inputs.gross / divisor)}</strong></div>
        <div><span>Salary income tax incl. cess</span><strong className="negative">−{formatINR(takeHome.salaryTax / divisor)}</strong></div>
        <div><span>Employee PF contribution</span><strong className="negative">−{formatINR(pfValue)}</strong></div>
        <div><span>Professional tax</span><strong className="negative">−{formatINR(ptValue)}</strong></div>
        <div className="takehome-annual">
          <span>{mode === 'monthly' ? 'Salary in-hand / month (fixed salary only)' : 'Salary in-hand / year (fixed salary only)'}</span>
          <strong>{formatINR(salaryInHandValue)}</strong>
        </div>
      </div>
    </section>
  )
}
