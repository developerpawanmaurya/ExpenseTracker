import { useState } from 'react'

export default function CategoryManager({ categories, expenses, onAdd, onDelete }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6ea8fe')

  async function add() {
    if (!name.trim()) return
    await onAdd({ name: name.trim(), color })
    setName('')
  }

  return (
    <div>
      <button className="btn btn-ghost text-sm" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Manage categories
      </button>
      {open && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 pill"
                style={{ color: c.color }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-slate-700 dark:text-slate-200">{c.name}</span>
                <button
                  className="text-slate-400 hover:text-red-500 text-sm leading-none"
                  title="Delete category"
                  onClick={() => {
                    const inUse = expenses.some((e) => e.category_id === c.id)
                    if (
                      inUse &&
                      !confirm(
                        'Some expenses use this category. Delete it anyway? Those expenses will show no category.',
                      )
                    )
                      return
                    onDelete(c.id)
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.5fr_auto] gap-2 mt-3">
            <input className="input" placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className="input h-10 p-1"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <button className="btn" onClick={add}>
              Add category
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
