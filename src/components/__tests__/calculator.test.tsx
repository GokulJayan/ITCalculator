import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InputPanel } from '../InputPanel'
import { ReliefNotice } from '../ReliefNotice'
import { calculateTax } from '../../engine/tax'
import { defaultInputs } from '../../state/useInputs'

describe('calculator inputs and relief notice', () => {
  it('parses shorthand salary input such as 12L', () => {
    const onChange = vi.fn()
    render(<InputPanel inputs={defaultInputs} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Annual gross salary'), {
      target: { value: '12L' },
    })

    expect(onChange).toHaveBeenLastCalledWith({ gross: 1_200_000 })
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
