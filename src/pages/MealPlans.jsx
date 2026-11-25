import { useMemo, useState } from 'react'
import { Dumbbell, Zap, Flame, Check, Wand2, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import { Sheet } from '../components/ui'
import { MEAL_PLANS, buildPlanItems } from '../data/mealPlans'
import { sumNutrients, fmt } from '../lib/nutrition'

import { t } from '../i18n'
import { itemName } from '../i18n/content';

const STYLE = {
  hipertrofia: { icon: Dumbbell, grad: 'from-violet-500 to-fuchsia-600', ring: 'ring-violet-500', text: 'text-violet-600 dark:text-violet-300' },
  energia: { icon: Zap, grad: 'from-amber-400 to-orange-500', ring: 'ring-amber-500', text: 'text-amber-600 dark:text-amber-300' },
  definicao: { icon: Flame, grad: 'from-rose-500 to-orange-500', ring: 'ring-rose-500', text: 'text-rose-600 dark:text-rose-300' },
}
const GOAL_TO_PLAN = { massa: 'hipertrofia', emagrecer: 'definicao', reeducacao: 'definicao', energia: 'energia', manter: 'energia' }

// Recalcula o cardápio escalando as gramas para bater a meta calórica da pessoa
const RAW = Object.fromEntries(MEAL_PLANS.map((p) => [p.id, p]))

export default function MealPlans({ go }) {
  const { profile, goals, applyPlan, day } = useApp()
  const suggested = GOAL_TO_PLAN[profile.goal] || 'energia'
  const [sel, setSel] = useState(suggested)
  const [fit, setFit] = useState(true)
  const [confirm, setConfirm] = useState(false)

  const plan = RAW[sel]
  const scale = fit ? Math.min(1.6, Math.max(0.6, goals.kcal / plan.total.kcal)) : 1
  const meals = useMemo(() => plan.mealsBuilt.map((m) => ({
    ...m, items: fit ? buildPlanItems(m.items.map((i) => [i.foodId, i.grams]), scale) : m.items,
  })), [plan, fit, scale])
  const total = sumNutrients(meals.flatMap((m) => m.items))
  const st = STYLE[sel]
  const hasFood = day.meals.some((m) => m.items.length)

  const apply = (replace) => { applyPlan(meals, replace); setConfirm(false); go('diario') }

  return (
    <div>
      <Header title={t('Cardápios')} subtitle={t('Planos prontos por objetivo')} />

      <div className="grid grid-cols-3 gap-2">
        {MEAL_PLANS.map((p) => {
          const s = STYLE[p.id]
          const on = sel === p.id
          return (
            <button key={p.id} onClick={() => setSel(p.id)} aria-pressed={on}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${s.grad} p-3 text-left text-white transition active:scale-95 ${on ? 'ring-4 ring-offset-2 ring-offset-[var(--bg)] ' + s.ring : 'opacity-75'}`}>
              <s.icon size={22} />
              <p className="mt-6 font-display text-[14px] font-bold leading-tight">{t(p.name)}</p>
              {p.id === suggested && <span className="absolute right-2 top-2 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-bold uppercase backdrop-blur">{t('Seu objetivo')}</span>}
            </button>
          );
        })}
      </div>

      <section className="card mt-4">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${st.text}`}>{t(plan.subtitle)}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="tnum font-display text-[32px] font-extrabold leading-none">{fmt(total.kcal)}<span className="ml-1 text-sm font-semibold muted">kcal</span></p>
            <p className="mt-1 text-xs muted tnum">{t('Sua meta:')} {fmt(goals.kcal)} kcal</p>
          </div>
          <div className="text-right text-[12px] font-semibold tnum">
            <p className="text-rose-500">{t('P')} {fmt(total.protein)} g</p>
            <p className="text-amber-500">{t('C')} {fmt(total.carbs)} g</p>
            <p className="text-violet-500">{t('G')} {fmt(total.fat)} g</p>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-400/10">
          <Wand2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="flex-1 text-[13px]"><b>{t('Ajustar porções à minha meta')}</b><br /><span className="muted">{fit ? t('Porções multiplicadas por {n}×', { n: fmt(scale, 2) }) : t('Cardápio base de {n} kcal', { n: fmt(plan.total.kcal) })}</span></span>
          <input id="plan-fit" type="checkbox" className="peer sr-only" checked={fit} onChange={(e) => setFit(e.target.checked)} />
          <span className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 dark:bg-white/20 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </section>

      <div className="mt-3 space-y-2.5">
        {meals.map((m) => {
          const tot = sumNutrients(m.items)
          return (
            <section key={m.id} className="card !py-3.5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-[15px] font-bold">{t(m.name)} <span className="text-xs font-medium muted">· {m.time}</span></h3>
                <span className="tnum text-sm font-bold">{fmt(tot.kcal)} kcal</span>
              </div>
              <ul className="mt-2 space-y-1">
                {m.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3 text-[13.5px]">
                    <span className="min-w-0 truncate"><span className="tnum font-semibold">{fmt(it.grams)} g</span> <span className="muted">{itemName(it)}</span></span>
                    <span className="tnum shrink-0 muted">{fmt(it.kcal)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="mt-3 flex gap-2 px-1 text-xs muted"><Info size={14} className="mt-0.5 shrink-0" /> {t(
          'Cardápios ilustrativos. Para um plano individualizado, consulte um(a) nutricionista.'
        )}</p>

      <div className="sticky z-20 mt-4 pb-2" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}>
        <button onClick={() => (hasFood ? setConfirm(true) : apply(true))} className={`btn w-full bg-gradient-to-r ${st.grad} !py-4 text-[15px] text-white shadow-lg`}>
          <Check size={18} /> {t('Aplicar este cardápio ao dia')}</button>
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t('Você já registrou refeições')}>
        <p className="text-sm muted">{t('O que fazer com os alimentos que já estão no diário deste dia?')}</p>
        <div className="mt-4 space-y-2">
          <button className="btn-primary w-full !py-3.5" onClick={() => apply(true)}>{t('Substituir pelo cardápio')}</button>
          <button className="btn-ghost w-full !py-3.5" onClick={() => apply(false)}>{t('Somar ao que já registrei')}</button>
        </div>
      </Sheet>
    </div>
  );
}
