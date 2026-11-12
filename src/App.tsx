import { lazy, Suspense, useMemo, useState } from 'react'
import { FY } from './config/fy2026-27'
import { InputPanel } from './components/InputPanel'
import { RaiseSimulator } from './components/RaiseSimulator'
import { ReliefNotice } from './components/ReliefNotice'
import { ResultSummary, SlabTable, TakeHomeCard } from './components/Results'
import { calculateTax } from './engine/tax'
import { takeHome as calculateTakeHome } from './engine/takeHome'
import { useInputs } from './state/useInputs'
import './App.css'

const Charts = lazy(() =>
  import('./components/Charts').then((module) => ({ default: module.Charts })),
)

function App() {
  const { inputs, setInputs } = useInputs()
  const [copyMessage, setCopyMessage] = useState('')
  const result = useMemo(() => calculateTax(inputs), [inputs])
  const takeHome = useMemo(() => calculateTakeHome(inputs, result), [inputs, result])

  async function shareEstimate() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyMessage('Share link copied')
    } catch {
      setCopyMessage('Copy the address bar link to share your inputs')
    }
    window.setTimeout(() => setCopyMessage(''), 3500)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Paisa tax calculator home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <ellipse cx="9" cy="7" rx="5" ry="2.5" />
              <path d="M4 7v3c0 1.4 2.2 2.5 5 2.5 1 0 1.9-.1 2.7-.4M4 10v3c0 1.4 2.2 2.5 5 2.5.8 0 1.6-.1 2.3-.3M4 13v3c0 1.4 2.2 2.5 5 2.5" />
              <ellipse cx="16" cy="13" rx="4" ry="2" />
              <path d="M12 13v2.5c0 1.1 1.8 2 4 2s4-.9 4-2V13" />
            </svg>
          </span>
          <span>chillara<span className="brand-dot">.</span></span>
        </a>
        <div className="topbar-actions">
          <span className="fy-pill">{FY.label} <span>·</span> New regime</span>
          <button type="button" className="share-button no-print" onClick={shareEstimate}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 10v6h12v-6" /></svg>
            Share estimate
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><i /> TAX PLANNING, MADE CLEAR</span>
            <h1>Know what you<br className="desktop-break" /> <em>actually take home.</em></h1>
            <p>A considered estimate of your income tax and monthly in-hand pay under India’s new tax regime.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun-disc" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-rupee">₹</div>
            <div className="hero-caption">YOUR MONEY<br />AT A GLANCE</div>
          </div>
        </section>

        <div className="calculator-layout">
          <InputPanel
            inputs={inputs}
            onChange={(updates) =>
              setInputs((previous) => {
                const next = { ...previous, ...updates }
                if (updates.gross !== undefined && previous.basicMatchesGross) {
                  next.basic = updates.gross
                }
                return next
              })
            }
          />

          <div className="results-column">
            <ResultSummary inputs={inputs} result={result} takeHome={takeHome} />

            <ReliefNotice result={result} />

            <TakeHomeCard inputs={inputs} result={result} takeHome={takeHome} />
            <SlabTable result={result} />
            <RaiseSimulator inputs={inputs} />
          </div>
        </div>

        <Suspense fallback={<div className="card content-card chart-loading">Loading charts…</div>}>
          <Charts inputs={inputs} result={result} />
        </Suspense>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <ellipse cx="9" cy="7" rx="5" ry="2.5" />
              <path d="M4 7v3c0 1.4 2.2 2.5 5 2.5 1 0 1.9-.1 2.7-.4M4 10v3c0 1.4 2.2 2.5 5 2.5.8 0 1.6-.1 2.3-.3M4 13v3c0 1.4 2.2 2.5 5 2.5" />
              <ellipse cx="16" cy="13" rx="4" ry="2" />
              <path d="M12 13v2.5c0 1.1 1.8 2 4 2s4-.9 4-2V13" />
            </svg>
          </span>
          <strong>paisa.</strong>
        </div>
        <div className="footer-copy">
          <span>For {FY.label} ({FY.assessmentYear}) · New tax regime</span>
          <p>Planning estimate only, not tax advice. Tax-rule assumptions follow the supplied plan and have not been independently verified against current official sources. Professional tax is user-configured; actual payroll and tax outcomes may differ.</p>
        </div>
        <button className="text-button no-print" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
      </footer>

      <div className="share-toast" role="status" aria-live="polite">{copyMessage}</div>
      <div className="mobile-taxbar no-print">
        <div><span>Salary in-hand / month</span><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(takeHome.salaryMonthly)}</strong></div>
        <div><span>Total tax / year</span><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(takeHome.totalTax)}</strong></div>
      </div>
    </div>
  )
}

export default App
