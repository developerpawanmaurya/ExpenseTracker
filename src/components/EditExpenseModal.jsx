import { useEffect, useState } from 'react'

export default function EditExpenseModal({ expense, categories, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...expense }))
  useEffect(() => setForm({ ...expense }), [expense])
  if (!expense) return null

  function set(key, v) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function save() {
    const amt = parseFloat(form.amount)
    if (!form.description || isNaN(amt) || amt < 0) {
      alert('Please enter a description and a valid amount.')
      return
    }
    await onSave({
      id: form.id,
      description: form.description.trim(),
      amount: amt,
      category_id: form.category_id,
      date: form.date,
      note: (form.note || '').trim() || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 grid place-items-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="card w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-3">Edit expense</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Description</label>
            <input className="input" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.amount ?? ''}
              onChange={(e) => set('amount', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id || ''} onChange={(e) => set('category_id', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Note</label>
            <input className="input" value={form.note || ''} onChange={(e) => set('note', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
