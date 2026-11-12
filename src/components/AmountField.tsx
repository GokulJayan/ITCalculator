import { formatInputAmount, parseAmount } from '../utils/formatINR'

interface AmountFieldProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  compact?: boolean
}

export function AmountField({
  id,
  label,
  value,
  onChange,
  hint,
  compact = false,
}: AmountFieldProps) {
  return (
    <label className={`field ${compact ? 'field-compact' : ''}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="amount-input-wrap">
        <span aria-hidden="true">₹</span>
        <input
          id={id}
          inputMode="decimal"
          defaultValue={formatInputAmount(value)}
          onChange={(event) => {
            const parsed = parseAmount(event.target.value)
            if (parsed !== undefined) onChange(Math.max(0, parsed))
          }}
          onBlur={(event) => {
            event.currentTarget.value = formatInputAmount(value)
          }}
          aria-label={label}
        />
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
