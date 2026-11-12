import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { FY } from '../config/fy2026-27'
import { reliefBand, sweep } from '../engine/analysis'
import { takeHome as calculateTakeHome } from '../engine/takeHome'
import type { TaxInputs, TaxResult } from '../engine/tax'
import { formatINR, formatINRCompact } from '../utils/formatINR'

interface ChartsProps {
  inputs: TaxInputs
  result: TaxResult
}

const chartTooltip = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>Gross {formatINR(Number(label))}</strong>
      {payload.map((item) => (
        <span key={String(item.name)} style={{ color: item.color }}>
          {String(item.name)}: {String(item.name).includes('rate') ? `${(Number(item.value) * 100).toFixed(1)}%` : formatINR(Number(item.value))}
        </span>
      ))}
    </div>
  )
}

export function Charts({ inputs, result }: ChartsProps) {
  const data = useMemo(() => sweep(500_000, 3_000_000, 301, inputs), [inputs])
  const band = reliefBand()
  const takeHome = calculateTakeHome(inputs, result)
  const donut = [
    { name: 'In-hand', value: takeHome.annual, fill: '#2a7665' },
    { name: 'Income tax', value: result.total, fill: '#ee987c' },
    { name: 'PF', value: takeHome.pf, fill: '#e8b44e' },
    { name: 'Professional tax', value: takeHome.pt, fill: '#b7c8b7' },
  ].filter((entry) => entry.value > 0)

  return (
    <div className="chart-grid">
      <section className="card content-card chart-card chart-wide">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEE THE BIG PICTURE</span>
            <h2>Gross salary vs take-home</h2>
          </div>
          <span className="chart-legend"><i />Annual in-hand</span>
        </div>
        <p className="chart-description">Estimated take-home across an annual salary range of ₹5L to ₹30L.</p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#e9eee9" vertical={false} />
              <XAxis dataKey="gross" type="number" domain={[500_000, 3_000_000]} tickFormatter={formatINRCompact} minTickGap={28} />
              <YAxis tickFormatter={formatINRCompact} width={66} />
              <Tooltip content={chartTooltip} />
              <ReferenceArea x1={band.start} x2={band.end} fill="#f3c878" fillOpacity={0.24} />
              <ReferenceLine x={inputs.gross} stroke="#31594e" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="annualTakeHome" name="Annual in-hand" stroke="#2a7665" fill="#dcebe3" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-footnote">
          Shaded area shows the estimated rebate marginal-relief band ({formatINR(band.start)}–{formatINR(band.end)} gross for a salaried person with no other deductions).
        </p>
      </section>

      <section className="card content-card chart-card">
        <div className="section-heading">
          <div><span className="eyebrow">TAX IMPACT</span><h2>Marginal tax rate</h2></div>
        </div>
        <p className="chart-description">Estimated extra tax on the next ₹100 of salary, including cess.</p>
        <div className="chart-wrap chart-small">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#e9eee9" vertical={false} />
              <XAxis dataKey="gross" type="number" domain={[500_000, 3_000_000]} tickFormatter={formatINRCompact} minTickGap={26} />
              <YAxis tickFormatter={(value: number) => `${Math.round(value * 100)}%`} width={42} />
              <Tooltip content={chartTooltip} />
              <ReferenceArea x1={band.start} x2={band.end} fill="#f3c878" fillOpacity={0.24} />
              <ReferenceLine x={inputs.gross} stroke="#31594e" strokeDasharray="4 4" />
              <Line type="stepAfter" dataKey="marginalRate" name="Marginal tax rate" stroke="#d98565" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-footnote">The temporary spike in the shaded band is why marginal relief matters.</p>
      </section>

      <section className="card content-card chart-card donut-card">
        <div className="section-heading">
          <div><span className="eyebrow">ANNUAL BREAKDOWN</span><h2>Where it goes</h2></div>
        </div>
        <div className="donut-layout">
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none" />
                <Tooltip formatter={(value) => formatINR(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{formatINRCompact(inputs.gross)}</strong><span>gross salary</span></div>
          </div>
          <ul className="donut-legend">
            {donut.map((entry) => (
              <li key={entry.name}><i style={{ backgroundColor: entry.fill }} /><span>{entry.name}</span><strong>{formatINR(entry.value)}</strong></li>
            ))}
          </ul>
        </div>
        <p className="chart-footnote">The tax schedule used for this estimate is configured for {FY.label}.</p>
      </section>
    </div>
  )
}
