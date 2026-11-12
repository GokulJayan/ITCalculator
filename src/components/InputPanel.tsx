import type { TaxInputs } from '../engine/tax'
import { AmountField } from './AmountField'

interface InputPanelProps {
  inputs: TaxInputs
  onChange: (updates: Partial<TaxInputs>) => void
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  return (
    <aside className="input-panel card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR DETAILS</span>
          <h2>Build your estimate</h2>
        </div>
        <span className="live-dot" aria-label="Results update live" />
      </div>

      <AmountField
        id="gross"
        label="Annual gross salary"
        value={inputs.gross}
        onChange={(gross) => onChange({ gross })}
        hint="Try 12L or 1.2cr"
      />
      <div className="toggle-row">
        <div>
          <strong>Basic salary follows gross</strong>
          <span>Use the same value as gross</span>
        </div>
        <input
          type="checkbox"
          checked={inputs.basicMatchesGross}
          onChange={(event) => {
            const basicMatchesGross = event.target.checked
            onChange({
              basicMatchesGross,
              basic: basicMatchesGross ? inputs.gross : inputs.basic,
            })
          }}
          aria-label="Basic salary follows gross"
        />
      </div>
      {!inputs.basicMatchesGross && (
        <AmountField
          id="basic"
          label="Annual basic salary"
          value={inputs.basic}
          onChange={(basic) => onChange({ basic })}
          hint="Used to estimate your employee PF share"
        />
      )}

      <div className="toggle-row">
        <div>
          <strong>Salaried</strong>
          <span>Apply standard deduction</span>
        </div>
        <input
          type="checkbox"
          checked={inputs.salaried}
          onChange={(event) => onChange({ salaried: event.target.checked })}
          aria-label="Salaried"
        />
      </div>

      <div className="toggle-row">
        <div>
          <strong>Employee PF</strong>
          <span>Half of combined PF rate</span>
        </div>
        <input
          type="checkbox"
          checked={inputs.pfOn}
          onChange={(event) => onChange({ pfOn: event.target.checked })}
          aria-label="Employee PF"
        />
      </div>
      {inputs.pfOn && (
        <label className="field field-compact" htmlFor="pfRate">
          <span className="field-label">Combined PF rate</span>
          <span className="rate-input">
            <input
              id="pfRate"
              type="number"
              min="0"
              max="30"
              step="0.5"
              inputMode="decimal"
              value={inputs.pfRate * 100}
              onChange={(event) =>
                onChange({
                  pfRate: Math.min(0.3, Math.max(0, Number(event.target.value) / 100)),
                })
              }
            />
            <span>%</span>
          </span>
        </label>
      )}

      <details className="advanced-fields">
        <summary>Advanced inputs <span>Other income, deductions & tax</span></summary>
        <div className="advanced-body">
          <AmountField
            id="otherIncome"
            label="Other taxable income"
            value={inputs.otherIncome}
            onChange={(otherIncome) => onChange({ otherIncome })}
            compact
          />
          <AmountField
            id="employerNps"
            label="Employer NPS contribution"
            value={inputs.employerNps}
            onChange={(employerNps) => onChange({ employerNps })}
            hint="Entered amount is treated as deductible"
            compact
          />
          <AmountField
            id="familyPension"
            label="Family pension received"
            value={inputs.familyPension}
            onChange={(familyPension) => onChange({ familyPension })}
            hint="Deduction modeled as ⅓, capped at ₹25,000"
            compact
          />
          <AmountField
            id="customPT"
            label="Professional tax per year"
            value={inputs.customPT}
            onChange={(customPT) => onChange({ customPT })}
            hint="Custom amount; state schedules are not included"
            compact
          />
          <div className="toggle-row">
            <div>
              <strong>Non-resident (NRI)</strong>
              <span>Exclude section 87A rebate</span>
            </div>
            <input
              type="checkbox"
              checked={inputs.nri}
              onChange={(event) => onChange({ nri: event.target.checked })}
              aria-label="Non-resident (NRI)"
            />
          </div>
        </div>
      </details>
      <div className="assumption-note">
        PF is estimated on basic salary. Actual payroll rules may differ.
      </div>
    </aside>
  )
}
