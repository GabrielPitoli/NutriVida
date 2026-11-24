import { GRADES } from '../lib/quality'

const MOUTH = {
  5: 'M7 14.2 Q12 19.5 17 14.2', // sorriso grande
  4: 'M8 14.8 Q12 17.6 16 14.8', // sorriso
  3: 'M8.2 15.6 L15.8 15.6', // neutro
  2: 'M8 16.8 Q12 14.4 16 16.8', // triste
  1: 'M7.2 17.6 Q12 12.8 16.8 17.6', // muito triste
}

/** Carinha colorida de qualidade nutricional. Aceita nota fracionada (média) e arredonda. */
export function QualityFace({ grade, size = 20, title }) {
  if (grade == null) return null
  const g = Math.min(5, Math.max(1, Math.round(grade)))
  const c = GRADES[g]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title || `Qualidade: ${c.label}`} className="shrink-0">
      <circle cx="12" cy="12" r="11" fill={c.color} />
      {g === 1 ? (
        <>
          <path d="M6.8 8.2 L9.6 10.2 M17.2 8.2 L14.4 10.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="8.6" cy="9.6" r="1.45" fill="#fff" />
          <circle cx="15.4" cy="9.6" r="1.45" fill="#fff" />
        </>
      )}
      <path d={MOUTH[g]} stroke="#fff" strokeWidth="1.9" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function QualityBadge({ grade, size = 18, className = '' }) {
  if (grade == null) return null
  const g = Math.min(5, Math.max(1, Math.round(grade)))
  return (
    <span className={`inline-flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2.5 text-[12px] font-bold ${GRADES[g].soft} ${className}`}>
      <QualityFace grade={g} size={size} /> {GRADES[g].label}
    </span>
  )
}

export function QualityReasons({ reasons }) {
  if (!reasons?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {reasons.map(([k, t]) => (
        <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${k === '+' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300' : k === '-' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>
          {k === '+' ? '▲ ' : k === '-' ? '▼ ' : ''}{t}
        </span>
      ))}
    </div>
  )
}

export function QualityLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {[5, 4, 3, 2, 1].map((g) => (
        <span key={g} className="inline-flex items-center gap-1 text-[11px] font-semibold muted"><QualityFace grade={g} size={14} />{GRADES[g].label}</span>
      ))}
    </div>
  )
}
