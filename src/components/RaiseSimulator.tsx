import { useState } from 'react'
import { calculateTax, type TaxInputs } from '../engine/tax'
import { takeHome } from '../engine/takeHome'
import { formatINR } from '../utils/formatINR'

export function RaiseSimulator({ inputs }: { inputs: TaxInputs }) {
  const [raise, setRaise] = useState(100_000)
  const currentTax = calculateTax(inputs)
  const nextInputs = { ...inputs, gross: inputs.gross + raise }
  const nextTax = calculateTax(nextInputs)
  const currentTakeHome = takeHome(inputs, currentTax)
  const nextTakeHome = takeHome(nextInputs, nextTax)
  const monthlyGain = nextTakeHome.salaryMonthly - currentTakeHome.salaryMonthly

  return (
    <section className="card content-card raise-card">
      <div className="section-heading">
        <div><span className="eyebrow">PLAN YOUR NEXT MOVE</span><h2>What if you get a raise?</h2></div>
      </div>
      <div className="raise-control">
        <label htmlFor="raise-slider">Annual raise</label>
        <strong>{formatINR(raise)}</strong>
        <input
          id="raise-slider"
          type="range"
          min="0"
          max="1000000"
          step="10_000"
          value={raise}
          onChange={(event) => setRaise(Number(event.target.value))}
        />
        <div className="range-labels"><span>₹0</span><span>₹10L</span></div>
      </div>
      <div className="raise-result">
        <span>Estimated monthly in-hand increase</span>
        <strong>{formatINR(Math.max(0, monthlyGain))}<small>/ month</small></strong>
      </div>
      {monthlyGain < 0 && (
        <p className="chart-footnote">The estimate shows no additional monthly in-hand from this raise; check your inputs and applicable marginal relief.</p>
      )}
    </section>
  )
}
