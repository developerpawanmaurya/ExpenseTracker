import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { daysInMonth, fmtMoney, monthKey, parseMonthKey } from '../lib/format'

export default function Charts({ expenses, categories, viewMonth, currency }) {
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const monthList = useMemo(() => expenses.filter((e) => monthKey(e.date) === viewMonth), [expenses, viewMonth])

  // By category
  const catData = useMemo(() => {
    const by = {}
    monthList.forEach((e) => {
      by[e.category_id] = (by[e.category_id] || 0) + Number(e.amount || 0)
    })
    return Object.entries(by).map(([id, value]) => ({
      id,
      name: catMap[id]?.name || 'Uncategorized',
      color: catMap[id]?.color || '#94a3b8',
      value,
    }))
  }, [monthList, catMap])

  // Daily
  const dailyData = useMemo(() => {
    const d = parseMonthKey(viewMonth)
    const days = daysInMonth(d.getFullYear(), d.getMonth())
    const arr = Array.from({ length: days }, (_, i) => ({ day: String(i + 1), amount: 0 }))
    monthList.forEach((e) => {
      const dayIdx = new Date(e.date + 'T00:00:00').getDate() - 1
      if (arr[dayIdx]) arr[dayIdx].amount += Number(e.amount || 0)
    })
    return arr
  }, [monthList, viewMonth])

  // Trend (last 12 months from today, regardless of viewMonth)
  const trendData = useMemo(() => {
    const months = []
    const base = new Date()
    base.setDate(1)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      months.push({ key: monthKey(d), label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) })
    }
    const totals = Object.fromEntries(months.map((m) => [m.key, 0]))
    expenses.forEach((e) => {
      const k = monthKey(e.date)
      if (k in totals) totals[k] += Number(e.amount || 0)
    })
    return months.map((m) => ({ month: m.label, amount: totals[m.key] }))
  }, [expenses])

  const fmtTip = (v) => fmtMoney(v, currency)
  const hasMonthData = monthList.length > 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-72">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">By Category</div>
          {hasMonthData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {catData.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={fmtTip} />
                <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyHint label="No expenses this month" />
          )}
        </div>

        <div className="h-72">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Daily Spend</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => fmtMoney(v, currency)} />
              <Tooltip formatter={fmtTip} />
              <Bar dataKey="amount" fill="#6ea8fe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-800" />

      <div className="h-60">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Last 12 months</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => fmtMoney(v, currency)} />
            <Tooltip formatter={fmtTip} />
            <Line type="monotone" dataKey="amount" stroke="#6ea8fe" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function EmptyHint({ label }) {
  return (
    <div className="h-full grid place-items-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
      {label}
    </div>
  )
}
