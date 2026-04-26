import { useState } from 'react'
import { todayISO } from '../lib/format'

export default function AddExpenseForm({ categories, onAdd, toast }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e?.preventDefault?.()
    const amt = parseFloat(amount)
    if (!description.trim()) return toast?.show('Enter a description')
    if (isNaN(amt) || amt <= 0) return toast?.show('Enter a positive amount')
    if (!categoryId) return toast?.show('Pick a category')
    setBusy(true)
    try {
      await onAdd({
        description: description.trim(),
        amount: amt,
        category_id: categoryId,
        date,
        note: note.trim() || null,
      })
      setDescription('')
      setAmount('')
      setNote('')
    } catch (err) {
      toast?.show(err.message || 'Failed to add expense')
    } finally {
      setBusy(false)
    }
  }

  // Fallback to first available category if current selection got deleted
  if (categoryId && !categories.find((c) => c.id === categoryId) && categories[0]) {
    setCategoryId(categories[0].id)
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-2">
      <input
        className="input md:col-span-2"
        placeholder="Description (e.g. Groceries)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="input"
        type="number"
        step="0.01"
        min="0"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? '…' : 'Add'}
        </button>
      </div>
    </form>
  )
}
