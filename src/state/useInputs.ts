import { useEffect, useState } from 'react'
import type { TaxInputs } from '../engine/tax'

export const defaultInputs: TaxInputs = {
  gross: 1_500_000,
  basic: 1_500_000,
  basicMatchesGross: true,
  otherIncome: 0,
  employerNps: 0,
  familyPension: 0,
  salaried: true,
  nri: false,
  customPT: 2_400,
  pfOn: true,
  pfRate: 0.12,
}

const numericKeys = [
  'gross',
  'basic',
  'otherIncome',
  'employerNps',
  'familyPension',
  'customPT',
  'pfRate',
] as const

function readInputsFromUrl(): TaxInputs {
  const inputs = { ...defaultInputs }
  const params = new URLSearchParams(window.location.search)
  for (const key of numericKeys) {
    const value = params.get(key)
    if (value !== null && Number.isFinite(Number(value))) {
      const parsed = Math.max(0, Number(value))
      inputs[key] = key === 'pfRate' ? Math.min(0.3, parsed) : parsed
    }
  }
  for (const key of ['salaried', 'nri', 'pfOn', 'basicMatchesGross'] as const) {
    const value = params.get(key)
    if (value === 'true' || value === 'false') inputs[key] = value === 'true'
  }
  return inputs
}

export function useInputs() {
  const [inputs, setInputs] = useState<TaxInputs>(readInputsFromUrl)

  useEffect(() => {
    const params = new URLSearchParams()
    for (const key of numericKeys) {
      if (inputs[key] !== defaultInputs[key]) params.set(key, String(inputs[key]))
    }
    for (const key of ['salaried', 'nri', 'pfOn', 'basicMatchesGross'] as const) {
      if (inputs[key] !== defaultInputs[key]) params.set(key, String(inputs[key]))
    }
    const query = params.toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }, [inputs])

  return { inputs, setInputs }
}
