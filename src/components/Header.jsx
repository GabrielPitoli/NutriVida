import { ChevronLeft, ChevronRight, Cloud, CloudOff, HardDrive, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDays, dayLabel, todayKey } from '../lib/dates'

import { t } from '../i18n';

const SYNC = {
  local: { icon: HardDrive, text: 'Salvo no aparelho', cls: 'text-slate-500' },
  connecting: { icon: Loader2, text: 'Conectando…', cls: 'text-slate-500', spin: true },
  saving: { icon: Loader2, text: 'Salvando…', cls: 'text-sky-600', spin: true },
  synced: { icon: Cloud, text: 'Salvo na nuvem', cls: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: CloudOff, text: 'Salvo só no aparelho', cls: 'text-amber-600' },
}

export function SyncBadge() {
  const { syncStatus } = useApp()
  const s = SYNC[syncStatus] || SYNC.local
  const I = s.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${s.cls}`} title={t(s.text)}>
      <I size={13} className={s.spin ? 'animate-spin' : ''} /> {t(s.text)}
    </span>
  )
}

export function DateSwitcher() {
  const { date, setDate } = useApp()
  const isToday = date === todayKey()
  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card ring-1 ring-black/[0.03] dark:bg-white/5 dark:shadow-none">
      <button aria-label={t('Dia anterior')} onClick={() => setDate(addDays(date, -1))} className="grid h-8 w-8 place-items-center rounded-full active:bg-slate-100 dark:active:bg-white/10"><ChevronLeft size={18} /></button>
      <button onClick={() => setDate(todayKey())} className="min-w-[74px] px-1 text-center text-[13px] font-bold capitalize">{dayLabel(date)}</button>
      <button aria-label={t('Próximo dia')} disabled={isToday} onClick={() => setDate(addDays(date, 1))} className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-30 active:bg-slate-100 dark:active:bg-white/10"><ChevronRight size={18} /></button>
    </div>
  );
}

export default function Header({ title, subtitle, right }) {
  return (
    <header className="sticky z-30 -mx-4 mb-3 bg-[var(--bg)]/90 px-4 pb-3 pt-4 backdrop-blur-xl" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {subtitle && <p className="truncate text-[13px] font-medium muted">{subtitle}</p>}
          <h1 className="truncate font-display text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  )
}
