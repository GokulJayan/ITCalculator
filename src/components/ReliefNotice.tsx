import type { TaxResult } from '../engine/tax'

export function ReliefNotice({ result }: { result: TaxResult }) {
  if (result.rebateRelief <= 0) return null

  return (
    <section className="relief-notice" role="status">
      <span className="relief-mark">↗</span>
      <div>
        <strong>You’re in the rebate marginal-relief band</strong>
        <p>
          Relief reduces your tax as income crosses the rebate threshold. The estimated marginal rate on the next ₹100 is {(result.marginalRate * 100).toFixed(0)}%.
        </p>
      </div>
    </section>
  )
}
