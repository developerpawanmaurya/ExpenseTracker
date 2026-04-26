import { useMemo, useState } from 'react'
import { fmtMoney, hexAlpha, monthKey } from '../lib/format'

export default function ExpenseTable({
  expenses,
  categories,
  viewMonth,
  currency,
  onEdit,
  onDelete,
  onClearAll,
}) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [range, setRange] = useState('month') // month | all | ytd | last30
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])

  const visible = useMemo(() => {
    const today = new Date()
    let list = expenses.slice()
    if (range === 'month') list = list.filter((e) => monthKey(e.date) === viewMonth)
    else if (range === 'ytd') list = list.filter((e) => new Date(e.date).getFullYear() === today.getFullYear())
    else if (range === 'last30') {
      const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30)
      list = list.filter((e) => new Date(e.date) >= cutoff)
    }
    if (catFilter) list = list.filter((e) => e.category_id === catFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          (e.description || '').toLowerCase().includes(q) ||
          (e.note || '').toLowerCase().includes(q) ||
          (catMap[e.category_id]?.name || '').toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      let va = a[sort.key],
        vb = b[sort.key]
      if (sort.key === 'amount') {
        va = Number(va)
        vb = Number(vb)
      }
      if (sort.key === 'category') {
        va = catMap[a.category_id]?.name || ''
        vb = catMap[b.category_id]?.name || ''
      }
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (va < vb) return sort.dir === 'asc' ? -1 : 1
      if (va > vb) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [expenses, range, catFilter, search, sort, viewMonth, catMap])

  const total = visible.reduce((a, e) => a + Number(e.amount || 0), 0)

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }
  const SortInd = ({ k }) => (
    <span className={`ml-1 text-[10px] ${sort.key === k ? 'opacity-100' : 'opacity-30'}`}>
      {sort.key === k ? (sort.dir === 'asc' ? '▲' : '▼') : '▼'}
    </span>
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input
          className="input w-auto min-w-[180px]"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="month">Selected month</option>
          <option value="all">All time</option>
          <option value="ytd">Year to date</option>
          <option value="last30">Last 30 days</option>
        </select>
        <span className="flex-1" />
        <span className="pill">
          {visible.length} item{visible.length === 1 ? '' : 's'} • {fmtMoney(total, currency)}
        </span>
        <button
          className="btn btn-danger btn-ghost"
          onClick={() => {
            if (expenses.length === 0) return
            if (confirm(`Permanently delete all ${expenses.length} expense(s)? This cannot be undone.`)) {
              onClearAll()
            }
          }}
        >
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {[
                ['date', 'Date'],
                ['description', 'Description'],
                ['category', 'Category'],
                ['amount', 'Amount', 'right'],
                [null, 'Note'],
                [null, ''],
              ].map(([k, label, align], i) => (
                <th
                  key={i}
                  className={`px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold ${
                    k ? 'cursor-pointer select-none' : ''
                  } ${align === 'right' ? 'text-right' : ''}`}
                  onClick={() => k && toggleSort(k)}
                >
                  {label}
                  {k && <SortInd k={k} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => {
              const c = catMap[e.category_id]
              const dtStr = new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: '2-digit',
              })
              return (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">{dtStr}</td>
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">{e.description}</td>
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: hexAlpha(c?.color, 0.18), color: c?.color || '#94a3b8' }}
                    >
                      {c?.name || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-right tabular-nums font-semibold whitespace-nowrap">
                    {fmtMoney(e.amount, currency)}
                  </td>
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    {e.note || ''}
                  </td>
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    <div className="flex gap-1.5 justify-end">
                      <button className="btn btn-ghost text-xs px-2 py-1" onClick={() => onEdit(e)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 text-red-500 hover:text-red-600"
                        onClick={() => {
                          if (confirm('Delete this expense?')) onDelete(e.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <div className="text-3xl mb-2">📒</div>
            <div>No expenses for this view. Add one above.</div>
          </div>
        )}
      </div>
    </div>
  )
}
