const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
})

export function formatINR(amount: number): string {
  return `₹${inrFormatter.format(Math.round(amount))}`
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2).replace(/\.?0+$/, '')} Cr`
  }
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2).replace(/\.?0+$/, '')} L`
  }
  return formatINR(amount)
}

export function parseAmount(input: string): number | undefined {
  const normalized = input.trim().toLowerCase().replace(/[₹,\s]/g, '')
  if (!normalized) return 0
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)(cr|crore|l|lac|lakh|k)?$/)
  if (!match) return undefined

  const value = Number(match[1])
  const multiplier = {
    cr: 10_000_000,
    crore: 10_000_000,
    l: 100_000,
    lac: 100_000,
    lakh: 100_000,
    k: 1_000,
  }[match[2] ?? '']
  return value * (multiplier ?? 1)
}

export function formatInputAmount(value: number): string {
  return inrFormatter.format(Math.round(value))
}
