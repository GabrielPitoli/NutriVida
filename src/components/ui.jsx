import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { fmt } from '../lib/nutrition'

import { t } from '../i18n';

export function ProgressRing({ value, max, size = 180, stroke = 14, color = '#10b981', track, children, overColor = '#f97316' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? value / max : 0
  const shown = Math.min(pct, 1)
  const over = pct > 1.1
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          className={track || 'stroke-slate-100 dark:stroke-white/[0.06]'} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={over ? overColor : color} strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1), stroke .3s' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function MacroBar({ label, value, goal, unit = 'g', color, compact }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  const done = value >= goal && goal > 0
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={`text-[13px] font-semibold ${compact ? '' : ''}`}>{label}</span>
        <span className="tnum text-[12px] muted">
          <b className="text-[13px] text-slate-900 dark:text-white">{fmt(value)}</b> / {fmt(goal)} {unit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
        <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${done ? 'animate-bump' : ''}`}
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function Sheet({ open, onClose, title, children, footer, full }) {
  const ref = useRef(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  // Só roda quando o sheet abre/fecha — nunca a cada tecla digitada (senão o teclado do celular fecha)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true })
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1}
        className={`relative flex w-full max-w-[480px] animate-slide-up flex-col rounded-t-[28px] bg-[var(--bg)] outline-none ${full ? 'h-[94dvh]' : 'max-h-[90dvh]'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 id={titleId} className="font-display text-xl font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label={t('Fechar')} className="grid h-9 w-9 place-items-center rounded-full bg-slate-200/70 text-slate-600 active:scale-90 dark:bg-white/10 dark:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-slate-200/70 px-5 py-3 dark:border-white/10">{footer}</div>}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, suffix, id }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, Math.round(v * 100) / 100)))
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => set(value - step)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-xl font-bold active:scale-90 dark:bg-white/10" aria-label={t('Diminuir')}>−</button>
      <div className="relative flex-1">
        <input id={id} inputMode="decimal" className="input text-center font-display text-lg font-bold tnum" value={value}
          onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); onChange(isNaN(v) ? 0 : v) }} />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm muted">{suffix}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-xl font-bold active:scale-90 dark:bg-white/10" aria-label={t('Aumentar')}>+</button>
    </div>
  );
}

export function NutrientGrid({ n, className = '' }) {
  const items = [
    ['kcal', fmt(n.kcal), 'text-emerald-600 dark:text-emerald-400'],
    ['Prot.', fmt(n.protein, 1) + 'g', 'text-rose-500'],
    ['Carb.', fmt(n.carbs, 1) + 'g', 'text-amber-500'],
    ['Gord.', fmt(n.fat, 1) + 'g', 'text-violet-500'],
    ['Fibras', fmt(n.fiber, 1) + 'g', 'text-lime-600 dark:text-lime-400'],
  ]
  return (
    <div className={`grid grid-cols-5 gap-1.5 ${className}`}>
      {items.map(([l, v, c]) => (
        <div key={l} className="rounded-2xl bg-slate-100/80 px-1 py-2 text-center dark:bg-white/5">
          <div className={`tnum font-display text-[15px] font-bold leading-tight ${c}`}>{v}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide muted">{t(l)}</div>
        </div>
      ))}
    </div>
  )
}

export const MacroDots = ({ it }) => (
  <span className="tnum text-[11.5px] muted">
    <span className="text-rose-500">{t('P')}</span> {fmt(it.protein, 1)} · <span className="text-amber-500">{t('C')}</span> {fmt(it.carbs, 1)} · <span className="text-violet-500">{t('G')}</span> {fmt(it.fat, 1)}
    {it.fiber ? <> · <span className="text-lime-600 dark:text-lime-400">{t('F')}</span> {fmt(it.fiber, 1)}</> : null}
  </span>
)

export function Field({ label, children, htmlFor, hint }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs muted">{hint}</span>}
    </label>
  )
}
