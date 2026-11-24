export const toKey = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d) }
export const todayKey = () => toKey(new Date())

export function dayLabel(k) {
  const t = todayKey()
  if (k === t) return 'Hoje'
  if (k === addDays(t, -1)) return 'Ontem'
  if (k === addDays(t, 1)) return 'Amanhã'
  return fromKey(k).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}
export const longDate = (k) => fromKey(k).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
