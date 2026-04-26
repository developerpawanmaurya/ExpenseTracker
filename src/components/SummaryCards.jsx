import { fmtMoney, parseMonthKey, daysInMonth, monthKey } from '../lib/format'

export default function SummaryCards({ expenses, viewMonth, currency }) {
  const prevMonth = monthKey(
    new Date(parseMonthKey(viewMonth).getFullYear(), parseMonthKey(viewMonth).getMonth() - 1, 1),
  )

  const sum = (pred) => expenses.reduce((a, e) => a + (pred(e) ? Number(e.amount) || 0 : 0), 0)
  const monthTotal = sum((e) => monthKey(e.date) === viewMonth)
  const lastTotal = sum((e) => monthKey(e.date) === prevMonth)
  const allTotal = sum(() => true)

  const today = new Date()
  const isCurrent = viewMonth === monthKey(today)
  const dt = parseMonthKey(viewMonth)
  const totalDays = daysInMonth(dt.getFullYear(), dt.getMonth())
  const elapsed = isCurrent ? today.getDate() : totalDays
  const dailyAvg = elapsed > 0 ? monthTotal / elapsed : 0

  let deltaText = 'no prior month data'
  let deltaClass = 'text-slate-500 dark:text-slate-400'
  if (lastTotal > 0) {
    const pct = ((monthTotal - lastTotal) / lastTotal) * 100
    deltaText = (pct >= 0 ? '▲ ' : '▼ ') + Math.abs(pct).toFixed(1) + '% vs last month'
    deltaClass = pct >= 0 ? 'text-red-500' : 'text-emerald-500'
  }

  const items = [
    { label: 'This month', value: fmtMoney(monthTotal, currency), sub: deltaText, subClass: deltaClass },
    { label: 'Last month', value: fmtMoney(lastTotal, currency), sub: 'previous period' },
    {
      label: 'Daily avg (this month)',
      value: fmtMoney(dailyAvg, currency),
      sub: isCurrent ? `over ${elapsed} day(s) so far` : `over ${elapsed} day(s)`,
    },
    {
      label: 'All-time total',
      value: fmtMoney(allTotal, currency),
      sub: `${expenses.length} expense(s)`,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="stat">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{it.label}</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight">{it.value}</div>
          <div className={`text-xs mt-1 ${it.subClass || 'text-slate-500 dark:text-slate-400'}`}>{it.sub}</div>
        </div>
      ))}
    </div>
  )
}
