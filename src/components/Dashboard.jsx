import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { CURRENCIES, fmtMonthLabel, monthKey, parseMonthKey, todayISO } from '../lib/format'
import SummaryCards from './SummaryCards'
import AddExpenseForm from './AddExpenseForm'
import ExpenseTable from './ExpenseTable'
import EditExpenseModal from './EditExpenseModal'
import Charts from './Charts'
import CategoryManager from './CategoryManager'
import { useToast } from './Toast'

export default function Dashboard({ session }) {
  const user = session.user
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [profile, setProfile] = useState({ currency: 'USD', theme: 'dark' })
  const [viewMonth, setViewMonth] = useState(monthKey(new Date()))
  const [editing, setEditing] = useState(null)

  // Theme toggle — apply class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', profile.theme === 'dark')
  }, [profile.theme])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [exp, cat, prof] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ])
    if (exp.error) toast.show(exp.error.message)
    if (cat.error) toast.show(cat.error.message)
    if (prof.error) toast.show(prof.error.message)
    setExpenses(exp.data || [])
    setCategories(cat.data || [])
    if (prof.data) setProfile({ currency: prof.data.currency || 'USD', theme: prof.data.theme || 'dark' })
    setLoading(false)
  }, [user.id, toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function updateProfile(patch) {
    const next = { ...profile, ...patch }
    setProfile(next)
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...next })
    if (error) toast.show(error.message)
  }

  async function addExpense(e) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...e, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setExpenses((list) => [data, ...list])
    toast.show('Added: ' + e.description)
  }

  async function updateExpense(e) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        description: e.description,
        amount: e.amount,
        category_id: e.category_id,
        date: e.date,
        note: e.note,
      })
      .eq('id', e.id)
      .select()
      .single()
    if (error) return toast.show(error.message)
    setExpenses((list) => list.map((x) => (x.id === data.id ? data : x)))
    setEditing(null)
    toast.show('Saved')
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return toast.show(error.message)
    setExpenses((list) => list.filter((x) => x.id !== id))
  }

  async function clearAllExpenses() {
    const { error } = await supabase.from('expenses').delete().eq('user_id', user.id)
    if (error) return toast.show(error.message)
    setExpenses([])
    toast.show('All expenses cleared')
  }

  async function addCategory(c) {
    const { data, error } = await supabase.from('categories').insert({ ...c, user_id: user.id }).select().single()
    if (error) return toast.show(error.message)
    setCategories((list) => [...list, data].sort((a, b) => a.name.localeCompare(b.name)))
    toast.show('Category added')
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return toast.show(error.message)
    setCategories((list) => list.filter((c) => c.id !== id))
  }

  function shiftMonth(delta) {
    const d = parseMonthKey(viewMonth)
    d.setMonth(d.getMonth() + delta)
    setViewMonth(monthKey(d))
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const rangeLabel = useMemo(() => {
    const d = parseMonthKey(viewMonth)
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(
      d.getFullYear(),
      d.getMonth(),
      days,
    ).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  }, [viewMonth])

  function exportJSON() {
    const data = { expenses, categories, currency: profile.currency, exported_at: new Date().toISOString() }
    download(`expenses-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json')
  }
  function exportCSV() {
    const catName = (id) => categories.find((c) => c.id === id)?.name || ''
    const rows = [['Date', 'Description', 'Category', 'Amount', 'Currency', 'Note']]
    expenses.forEach((e) => rows.push([e.date, e.description, catName(e.category_id), e.amount, profile.currency, e.note || '']))
    const csv = rows
      .map((r) =>
        r
          .map((v) => {
            const s = String(v ?? '')
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
          })
          .join(','),
      )
      .join('\n')
    download(`expenses-${todayISO()}.csv`, csv, 'text/csv')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Expense Tracker</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400">Signed in as {user.email}</div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="input w-auto"
            value={profile.currency}
            onChange={(e) => updateProfile({ currency: e.target.value })}
            title="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            title="Toggle theme"
            onClick={() => updateProfile({ theme: profile.theme === 'dark' ? 'light' : 'dark' })}
          >
            {profile.theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={exportJSON}>
            ⬇ JSON
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            ⬇ CSV
          </button>
          <button className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>
      ) : (
        <>
          <section className="card p-5 mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button className="btn btn-ghost" onClick={() => shiftMonth(-1)}>
                ←
              </button>
              <h3 className="text-lg font-semibold">{fmtMonthLabel(viewMonth)}</h3>
              <button className="btn btn-ghost" onClick={() => shiftMonth(1)}>
                →
              </button>
              <button className="btn btn-ghost" onClick={() => setViewMonth(monthKey(new Date()))}>
                Today
              </button>
              <span className="flex-1" />
              <span className="pill">{rangeLabel}</span>
            </div>
            <SummaryCards expenses={expenses} viewMonth={viewMonth} currency={profile.currency} />
          </section>

          <section className="card p-5 mb-4">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
              Add expense
            </h2>
            <AddExpenseForm categories={categories} onAdd={addExpense} toast={toast} />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Tip: press <b>Enter</b> in any field to submit.
            </p>
          </section>

          <section className="card p-5 mb-4">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
              Charts — for the selected month
            </h2>
            <Charts expenses={expenses} categories={categories} viewMonth={viewMonth} currency={profile.currency} />
          </section>

          <section className="card p-5 mb-4">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
              Expenses
            </h2>
            <ExpenseTable
              expenses={expenses}
              categories={categories}
              viewMonth={viewMonth}
              currency={profile.currency}
              onEdit={setEditing}
              onDelete={deleteExpense}
              onClearAll={clearAllExpenses}
            />
          </section>

          <section className="card p-5">
            <CategoryManager
              categories={categories}
              expenses={expenses}
              onAdd={addCategory}
              onDelete={deleteCategory}
            />
          </section>
        </>
      )}

      {editing && (
        <EditExpenseModal
          expense={editing}
          categories={categories}
          onSave={updateExpense}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function download(name, content, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
