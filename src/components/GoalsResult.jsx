import { Flame, Droplets, Wheat } from 'lucide-react'
import { fmt, goalById, activityById } from '../lib/nutrition'

import { t } from '../i18n';

/** Mostra as metas calculadas com o passo a passo do cálculo. */
export default function GoalsResult({ profile, goals, calc, showSteps = true }) {
  const g = goalById(profile.goal)
  const a = activityById(profile.activity)
  const b = calc.breakdown
  const macros = [
    ['Proteínas', goals.protein, 4, '#f43f5e'],
    ['Carboidratos', goals.carbs, 4, '#f59e0b'],
    ['Gorduras', goals.fat, 9, '#8b5cf6'],
  ]
  const totalK = macros.reduce((s, [, v, k]) => s + v * k, 0) || 1
  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-100">{t('Meta diária de calorias')}</p>
        <p className="tnum mt-1 font-display text-[52px] font-extrabold leading-none tracking-tight">{fmt(goals.kcal)}<span className="ml-1.5 text-lg font-bold text-emerald-100">kcal</span></p>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/20">
          {macros.map(([l, v, k, c]) => <div key={l} style={{ width: `${(v * k / totalK) * 100}%`, background: c }} />)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {macros.map(([l, v, k, c]) => (
            <div key={l} className="rounded-2xl bg-white/10 py-2">
              <p className="tnum font-display text-xl font-bold">{fmt(v)}g</p>
              <p className="text-[10.5px] font-semibold text-emerald-50/80"><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c }} />{t(l)} · {Math.round(v * k / totalK * 100)}%</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 text-[13px]">
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/10 py-2 tnum"><Droplets size={15} /> {fmt(goals.water / 1000, 2)} {t('L água')}</span>
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/10 py-2 tnum"><Wheat size={15} /> {goals.fiber} {t('g fibras')}</span>
        </div>
      </div>

      {showSteps && (
        <ol className="mt-3 space-y-2 text-[13px]">
          <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-white/5">
            <span><b>{t('1. Metabolismo basal')}</b><br /><span className="text-xs muted">{t('Mifflin-St Jeor ·')} {profile.sex === 'F' ? t('feminino') : t('masculino')}, {profile.age} {t('anos,')} {fmt(profile.weight, 1)} {t('kg,')} {profile.height} {t('cm')}</span></span>
            <span className="tnum shrink-0 font-bold">{fmt(b.tmb)} kcal</span>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-white/5">
            <span><b>{t('2. Gasto total diário')}</b><br /><span className="text-xs muted">{t('×')} {b.factor} ({a.label.toLowerCase()})</span></span>
            <span className="tnum shrink-0 font-bold">{fmt(b.tdee)} kcal</span>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-white/5">
            <span><b>{t('3. Ajuste do objetivo')}</b><br /><span className="text-xs muted">{g.label} · {b.adjust === 0 ? t('sem ajuste') : `${b.adjust > 0 ? '+' : ''}${Math.round(b.adjust * 100)}%`}{b.floored ? t(' · limitado ao mínimo seguro de {n} kcal', { n: fmt(b.floor) }) : ''}</span></span>
            <span className="tnum shrink-0 font-bold text-emerald-600 dark:text-emerald-400"><Flame size={13} className="mr-0.5 inline" />{fmt(calc.kcal)} kcal</span>
          </li>
        </ol>
      )}
    </div>
  );
}
