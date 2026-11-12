import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
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
        <div key={String(item.name)}>
          <span style={{ color: item.color }}>
            {String(item.name)}: {String(item.name).includes('rate') ? `${(Number(item.value) * 100).toFixed(1)}%` : formatINR(Number(item.value))}
          </span>
          {item.name === 'Annual in-hand' && (
            <span style={{ color: item.color, display: 'block' }}>
              Monthly in-hand: {formatINR(Number(item.value) / 12)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

const donutLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  value,
  fill,
}: {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  name?: string
  value?: number
  fill?: string
}) => {
  if (cx === undefined || cy === undefined || midAngle === undefined || outerRadius === undefined || !name) {
    return null
  }
  const color = fill ?? '#43564a'
  const radians = (-midAngle * Math.PI) / 180
  const startX = cx + outerRadius * Math.cos(radians)
  const startY = cy + outerRadius * Math.sin(radians)
  const leftSide = name === 'In-hand'
  const isIncomeTax = name.startsWith('Income tax')
  const labelX = cx + (leftSide ? -outerRadius - 42 : outerRadius + 54)
  const labelY = leftSide
    ? cy
    : isIncomeTax
      ? cy + outerRadius * 0.7
      : cy - outerRadius * 0.7
  const rightLane = isIncomeTax ? 36 : 18
  const elbowX = cx + (leftSide ? -outerRadius - 16 : outerRadius + rightLane)
  const lineEndX = labelX + (leftSide ? 8 : -8)

  return (
    <g>
      <path
        className="donut-callout"
        d={`M${startX},${startY} L${elbowX},${startY} L${elbowX},${labelY} L${lineEndX},${labelY}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      <circle className="donut-callout" cx={startX} cy={startY} r={3} fill={color} />
      <text
        className="donut-callout"
        x={labelX}
        y={labelY - 7}
        fill="#43564a"
        fontSize={15}
        fontWeight={600}
        textAnchor={leftSide ? 'end' : 'start'}
      >
        {name}
        {value !== undefined && (
          <tspan x={labelX} dy={18} fontSize={13} fontWeight={500}>
            {formatINR(value)}
          </tspan>
        )}
      </text>
    </g>
  )
}

export function Charts({ inputs, result }: ChartsProps) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)')
    const updateViewport = () => setIsMobile(mediaQuery.matches)
    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  const chartMax = Math.ceil(Math.max(3_000_000, inputs.gross * 1.15) / 100_000) * 100_000
  const data = useMemo(() => sweep(500_000, chartMax, 301, inputs), [chartMax, inputs])
  const band = reliefBand()
  const takeHome = calculateTakeHome(inputs, result)
  const donut = [
    { name: 'In-hand', value: takeHome.annual, fill: '#2a7665' },
    { name: 'Income tax incl. cess & PT', value: result.total + takeHome.pt, fill: '#ee987c' },
    { name: 'PF', value: takeHome.pf, fill: '#e8b44e' },
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
        <p className="chart-description">
          Estimated take-home across an annual salary range of ₹5L to {formatINRCompact(chartMax)}.
        </p>
        <div className="chart-axis-layout">
          <div className="chart-wrap chart-with-y-title">
            <span className="chart-y-title">Annual in-hand</span>
            <div className="chart-plot">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="#e9eee9" vertical={false} />
                  <XAxis dataKey="gross" type="number" domain={[500_000, chartMax]} tickFormatter={formatINRCompact} minTickGap={28} height={35} />
                  <YAxis tickFormatter={formatINRCompact} width={66} />
                  <Tooltip content={chartTooltip} />
                  <ReferenceArea x1={band.start} x2={band.end} fill="#f3c878" fillOpacity={0.24} />
                  <ReferenceLine x={inputs.gross} stroke="#31594e" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="annualTakeHome" name="Annual in-hand" stroke="#2a7665" fill="#dcebe3" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-x-title">Annual gross salary</div>
        </div>
        <p className="chart-footnote">
          Shaded area shows the estimated rebate marginal-relief band ({formatINR(band.start)}–{formatINR(band.end)} gross for a salaried person with no other deductions).
        </p>
      </section>

      <section className="card content-card chart-card donut-card">
        <div className="section-heading">
          <div><span className="eyebrow">ANNUAL BREAKDOWN</span><h2>Where it goes</h2></div>
        </div>
        <div className="donut-layout">
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? '25%' : '24%'}
                  outerRadius={isMobile ? '88%' : '78%'}
                  paddingAngle={3}
                  stroke="none"
                  label={isMobile ? false : donutLabel}
                  labelLine={false}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{formatINRCompact(inputs.gross)}</strong><span>gross</span></div>
          </div>
          <ul className="donut-mobile-legend">
            {donut.map((entry) => (
              <li key={entry.name}>
                <i style={{ backgroundColor: entry.fill }} />
                <span>{entry.name}</span>
                <strong>{formatINR(entry.value)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <p className="chart-footnote">The tax schedule used for this estimate is configured for {FY.label}.</p>
      </section>
    </div>
  )
}
