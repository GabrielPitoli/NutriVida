import { useState } from 'react'
import { Flame, Utensils, Droplets, Undo2, Plus, Activity, ChevronRight, Sparkles, Target, GlassWater } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header, { DateSwitcher, SyncBadge } from '../components/Header'
import { ProgressRing, MacroBar } from '../components/ui'
import RewardsStrip from '../components/Rewards'
import { QualityFace, QualityLegend } from '../components/Quality'
import { gradeOfItems, distribution, GRADES } from '../lib/quality'
import { FOODS_BY_ID } from '../data/foods'

function QualityCard() {
  const { day } = useApp()
  const items = day.meals.flatMap((m) => m.items)
  const avg = gradeOfItems(items, FOODS_BY_ID)
  const dist = distribution(items, FOODS_BY_ID)
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const g = avg ? Math.round(avg) : null
  const good = Math.round(((dist[5] + dist[4]) / total) * 100)
  const msg = !g ? 'Registre refeições para ver a qualidade do seu dia.'
    : g >= 5 ? 'Alimentação de primeira! Muita comida de verdade.'
    : g >= 4 ? 'Muito bom! A maior parte das calorias vem de boas escolhas.'
    : g >= 3 ? 'Dá para melhorar: troque um item amarelo ou vermelho por um verde.'
    : 'Atenção: muitos ultraprocessados ou açúcar hoje.'
  return (
    <section className="card" aria-labelledby="quality-title">
      <div className="flex items-center gap-3">
        {g ? <QualityFace grade={g} size={46} /> : <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-slate-100 text-xl dark:bg-white/5">?</span>}
        <div className="min-w-0 flex-1">
          <h2 id="quality-title" className="card-title">Qualidade da alimentação</h2>
          <p className="text-[13px]">{g ? <b style={{ color: GRADES[g].color }}>{GRADES[g].label}</b> : <span className="muted">Sem registros</span>}{g ? <span className="muted"> · {good}% das calorias em escolhas boas</span> : null}</p>
        </div>
      </div>
      {g && (
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5" role="img" aria-label="Calorias por qualidade">
          {[5, 4, 3, 2, 1].map((k) => dist[k] > 0 && <div key={k} style={{ width: (dist[k] / total) * 100 + '%', background: GRADES[k].color }} />)}
        </div>
      )}
      <p className="mt-2 text-[12.5px] muted">{msg}</p>
      <div className="mt-2"><QualityLegend /></div>
    </section>
  )
}
import { fmt, goalById, ACTIVITIES } from '../lib/nutrition'
import { greeting, longDate, todayKey } from '../lib/dates'

function WaterCard() {
  const { totals, goals, addWater, undoWater, day } = useApp()
  const [custom, setCustom] = useState('')
  const [bump, setBump] = useState(0)
  const pct = Math.min(100, (totals.water / goals.water) * 100)
  const done = totals.water >= goals.water
  const add = (ml) => { addWater(ml); setBump((b) => b + 1) }
  const cups = Math.round(totals.water / 250)

  return (
    <section className="card overflow-hidden" aria-labelledby="water-title">
      <div className="flex gap-4">
        {/* Copo com nível de água animado */}
        <div key={bump} className="relative h-[132px] w-[86px] shrink-0 animate-bump overflow-hidden rounded-b-[26px] rounded-t-xl border-[3px] border-sky-200 bg-sky-50 dark:border-sky-400/30 dark:bg-sky-400/5">
          <div className="absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out" style={{ height: `${pct}%` }}>
            <svg className="absolute -top-3 left-0 h-4 w-[200%] animate-wave text-sky-400 dark:text-sky-500" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" fill="currentColor" />
            </svg>
            <div className="h-full bg-gradient-to-b from-sky-400 to-blue-500 dark:from-sky-500 dark:to-blue-600" />
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <span className={`tnum font-display text-xl font-extrabold ${pct > 45 ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`}>{Math.round(pct)}%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 id="water-title" className="card-title flex items-center gap-1.5"><Droplets size={18} className="text-sky-500" /> Hidratação</h2>
            {day.water.length > 0 && (
              <button onClick={undoWater} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 active:scale-90 dark:bg-white/10" aria-label="Desfazer último registro de água"><Undo2 size={15} /></button>
            )}
          </div>
          <p className="mt-1 tnum">
            <span className="font-display text-[26px] font-extrabold text-sky-600 dark:text-sky-400">{(totals.water / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm muted"> / {fmt(goals.water / 1000, 2)} L</span>
          </p>
          <p className="text-xs muted">{done ? 'Meta batida! Continue se hidratando.' : `Faltam ${fmt(goals.water - totals.water)} ml · ${cups} copo${cups === 1 ? '' : 's'} hoje`}</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[200, 300, 500].map((ml) => (
              <button key={ml} onClick={() => add(ml)} className="rounded-xl bg-sky-50 py-2 text-[13px] font-bold text-sky-700 transition active:scale-95 active:bg-sky-100 dark:bg-sky-400/10 dark:text-sky-300">+{ml}</button>
            ))}
          </div>
        </div>
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = parseInt(custom, 10); if (v > 0) { add(v); setCustom('') } }}>
        <div className="relative flex-1">
          <GlassWater size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500" />
          <input id="water-custom" className="input !py-2.5 pl-10" inputMode="numeric" placeholder="Outra quantidade (ml)" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button className="btn !py-2.5 bg-sky-500 text-white" disabled={!custom}><Plus size={16} /> Add</button>
      </form>
    </section>
  )
}

export default function Dashboard({ go }) {
  const { profile, totals, goals, day, date, history } = useApp()
  const goal = goalById(profile.goal)
  const remaining = goals.kcal - totals.kcal + totals.burned
  const over = remaining < 0
  const mealSlots = Math.max(goals.meals, totals.mealsDone)
  const maxHist = Math.max(goals.kcal, ...history.map((h) => h.kcal)) || 1

  return (
    <div>
      <Header subtitle={date === todayKey() ? `${greeting()}${profile.name ? ', ' + profile.name : ''}` : longDate(date)} title={date === todayKey() ? 'Seu dia' : 'Resumo do dia'} right={<DateSwitcher />} />

      <div className="space-y-3">
        <RewardsStrip />
        {/* Calorias */}
        <section className="card" aria-labelledby="kcal-title">
          <div className="flex items-center justify-between">
            <h2 id="kcal-title" className="card-title">Balanço calórico</h2>
            <button onClick={() => go('perfil')} className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${goal.color} px-2.5 py-1 text-[11px] font-bold text-white`}>
              <Target size={12} /> {goal.short}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ProgressRing value={totals.kcal} max={goals.kcal + totals.burned} size={168} stroke={15}>
              <div>
                <div className={`tnum font-display text-[34px] font-extrabold leading-none ${over ? 'text-orange-500' : ''}`}>{fmt(Math.abs(remaining))}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider muted">{over ? 'kcal acima' : 'kcal restantes'}</div>
              </div>
            </ProgressRing>
            <dl className="flex-1 space-y-3">
              <div>
                <dt className="label">Meta</dt>
                <dd className="tnum font-display text-lg font-bold">{fmt(goals.kcal)} <span className="text-xs font-medium muted">kcal</span></dd>
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><Utensils size={15} /></span>
                <div><dt className="text-[11px] muted">Consumidas</dt><dd className="tnum text-[15px] font-bold">{fmt(totals.kcal)}</dd></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300"><Flame size={15} /></span>
                <div><dt className="text-[11px] muted">Gastas em treino</dt><dd className="tnum text-[15px] font-bold">{fmt(totals.burned)}</dd></div>
              </div>
            </dl>
          </div>
          <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-center text-[12px] muted dark:bg-white/[0.03] tnum">
            Meta {fmt(goals.kcal)} − consumidas {fmt(totals.kcal)} + treino {fmt(totals.burned)} = <b className="text-slate-800 dark:text-white">{fmt(remaining)} kcal</b>
          </p>
        </section>

        {/* Macros */}
        <section className="card space-y-3.5" aria-labelledby="macro-title">
          <div className="flex items-center justify-between">
            <h2 id="macro-title" className="card-title">Macronutrientes</h2>
            <span className="text-xs muted tnum">Fibras {fmt(totals.fiber)} / {goals.fiber} g</span>
          </div>
          <MacroBar label="Proteínas" value={totals.protein} goal={goals.protein} color="linear-gradient(90deg,#fb7185,#e11d48)" />
          <MacroBar label="Carboidratos" value={totals.carbs} goal={goals.carbs} color="linear-gradient(90deg,#fcd34d,#f59e0b)" />
          <MacroBar label="Gorduras" value={totals.fat} goal={goals.fat} color="linear-gradient(90deg,#c4b5fd,#7c3aed)" />
        </section>

        <QualityCard />

        <WaterCard />

        {/* Refeições */}
        <button onClick={() => go('diario')} className="card flex w-full items-center gap-4 text-left transition active:scale-[0.99]">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300"><Utensils size={24} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="tnum font-display text-2xl font-extrabold">{totals.mealsDone}</span>
              <span className="text-sm muted">de {goals.meals} refeições</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: mealSlots }).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i < totals.mealsDone ? 'bg-amber-500' : 'bg-slate-100 dark:bg-white/10'}`} />
              ))}
            </div>
            <p className="mt-1.5 truncate text-xs muted">
              {day.meals.filter((m) => m.items.length).map((m) => m.name).join(' · ') || 'Toque para registrar sua primeira refeição'}
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* Atividades */}
        <button onClick={() => go('diario', 'atividades')} className="card flex w-full items-center gap-4 text-left transition active:scale-[0.99]">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300"><Activity size={24} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="tnum font-display text-2xl font-extrabold">{fmt(totals.burned)}</span>
              <span className="text-sm muted">kcal em {day.activities.length} atividade{day.activities.length === 1 ? '' : 's'}</span>
            </div>
            <p className="mt-0.5 truncate text-xs muted">
              {day.activities.map((a) => `${ACTIVITIES.find((x) => x.id === a.type)?.label} ${a.minutes}min`).join(' · ') || 'Registre treinos para somar ao seu saldo'}
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* Semana */}
        <section className="card" aria-labelledby="week-title">
          <div className="flex items-center justify-between">
            <h2 id="week-title" className="card-title">Últimos 7 dias</h2>
            <span className="text-xs muted">kcal consumidas</span>
          </div>
          <div className="relative mt-4 flex h-28 items-end gap-2">
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-500/60" style={{ bottom: `${(goals.kcal / maxHist) * 100}%` }}>
              <span className="absolute -top-4 right-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">meta</span>
            </div>
            {history.map((h) => {
              const isSel = h.key === date
              return (
                <div key={h.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className={`w-full max-w-[28px] rounded-lg transition-all duration-700 ${isSel ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-400/25'}`} style={{ height: `${Math.max(3, (h.kcal / maxHist) * 100)}%` }} title={`${h.kcal} kcal`} />
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-2">
            {history.map((h) => (
              <span key={h.key} className={`flex-1 text-center text-[10px] font-semibold capitalize ${h.key === date ? 'text-emerald-600 dark:text-emerald-400' : 'muted'}`}>
                {new Date(h.key + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
              </span>
            ))}
          </div>
        </section>

        {/* Dica */}
        <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-emerald-200" />
            <div>
              <p className="font-display text-[15px] font-bold">Foco: {goal.label}</p>
              <p className="mt-0.5 text-[13px] text-emerald-50/90">{goal.tip}</p>
              {totals.kcal === 0 && (
                <button onClick={() => go('cardapios')} className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-[13px] font-semibold backdrop-blur active:scale-95">Ver cardápios prontos →</button>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-center pb-2 pt-1"><SyncBadge /></div>
      </div>
    </div>
  )
}
