export const CURRENCIES = [
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', locale: 'en-IN' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
  { code: 'CHF', symbol: 'CHF', locale: 'de-CH' },
  { code: 'CNY', symbol: '¥', locale: 'zh-CN' },
  { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
]

export function fmtMoney(amount, currencyCode = 'USD') {
  const cur = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0]
  try {
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency: cur.code,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)
  } catch {
    return cur.symbol + (Number(amount) || 0).toFixed(2)
  }
}

export function monthKey(d) {
  const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0')
}

export function parseMonthKey(k) {
  const [y, m] = k.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export function fmtMonthLabel(k) {
  return parseMonthKey(k).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function todayISO() {
  const d = new Date()
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate()
}

export function hexAlpha(hex, a) {
  if (!hex) return `rgba(110,168,254,${a})`
  const m = hex.replace('#', '')
  if (m.length !== 6) return hex
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
