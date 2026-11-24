import { useState } from 'react'
import { Plus, Trash2, ChevronDown, Coffee, Sun, UtensilsCrossed, Apple, Moon, Cookie, Clock, MoreHorizontal, Flame, Timer, X,
  Dumbbell, Footprints, PersonStanding, Bike, Waves, Trophy, Volleyball, Flower2, Music, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header, { DateSwitcher } from '../components/Header'
import FoodSheet from '../components/FoodSheet'
import { Sheet, Stepper, Field, MacroDots } from '../components/ui'
import { sumNutrients, fmt, ACTIVITIES, INTENSITIES, activityKcal } from '../lib/nutrition'
import { gradeItem, gradeOfItems, GRADES } from '../lib/quality'
import { FOODS_BY_ID } from '../data/foods'
import { QualityFace } from '../components/Quality'

const MEAL_ICON = { 'cafe': Coffee, 'lanche-manha': Apple, 'almoco': UtensilsCrossed, 'lanche-tarde': Cookie, 'jantar': Sun, 'ceia': Moon }
const ACT_ICON = { Dumbbell, Footprints, PersonStanding, Bike, Waves, Flame, Trophy, Volleyball, Flower2, Music }

function MealCard({ meal, onAdd }) {
  const { removeFood, removeMeal, clearMeal } = useApp()
  const [open, setOpen] = useState(true)
  const [menu, setMenu] = useState(false)
  const t = sumNutrients(meal.items)
  const Icon = MEAL_ICON[meal.id] || UtensilsCrossed
  const done = meal.items.length > 0
  const mq = gradeOfItems(meal.items, FOODS_BY_ID)
  return (
    <section className="card !p-0">
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors ${done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
          <Icon size={20} />
          {done && <CheckCircle2 size={16} className="absolute -bottom-1 -right-1 animate-pop rounded-full bg-white text-emerald-500 dark:bg-[#12201b]" />}
        </div>
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
          <h3 className="flex items-center gap-1.5 font-display text-[16px] font-bold"><span className="truncate">{meal.name}</span>{mq && <QualityFace grade={mq} size={17} title={`Qualidade da refeição: ${GRADES[Math.round(mq)].label}`} />}</h3>
          <p className="text-xs muted tnum">{meal.time && <><Clock size={11} className="mr-0.5 inline" />{meal.time} · </>}{meal.items.length ? `${fmt(t.kcal)} kcal · ${meal.items.length} ite${meal.items.length > 1 ? 'ns' : 'm'}` : 'Nada registrado'}</p>
        </button>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} aria-label="Opções da refeição" className="grid h-9 w-9 place-items-center rounded-full text-slate-400 active:bg-slate-100 dark:active:bg-white/10"><MoreHorizontal size={18} /></button>
          {menu && (
            <div className="absolute right-0 top-10 z-20 w-44 animate-fade-in overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-[#1a2b25] dark:ring-white/10" onMouseLeave={() => setMenu(false)}>
              {meal.items.length > 0 && <button className="block w-full px-4 py-3 text-left text-sm font-medium active:bg-slate-50 dark:active:bg-white/5" onClick={() => { clearMeal(meal.id); setMenu(false) }}>Limpar itens</button>}
              <button className="block w-full px-4 py-3 text-left text-sm font-medium text-rose-600 active:bg-rose-50 dark:active:bg-white/5" onClick={() => { removeMeal(meal.id); setMenu(false) }}>Remover refeição</button>
            </div>
          )}
        </div>
        <button onClick={() => setOpen(!open)} aria-label={open ? 'Recolher' : 'Expandir'} className="text-slate-400"><ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          {meal.items.length > 0 && (
            <ul className="mb-3 divide-y divide-slate-100 rounded-2xl bg-slate-50/70 px-3 dark:divide-white/5 dark:bg-white/[0.03]">
              {meal.items.map((it) => (
                <li key={it.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold"><QualityFace grade={gradeItem(it, FOODS_BY_ID)} size={15} /><span className="truncate">{it.name}</span></p>
                    <p className="text-[11.5px] muted tnum">{it.portion ? `${it.portion} · ` : ''}{it.grams ? `${fmt(it.grams)} g · ` : ''}<MacroDots it={it} /></p>
                  </div>
                  <span className="tnum shrink-0 text-sm font-bold">{fmt(it.kcal)}</span>
                  <button onClick={() => removeFood(meal.id, it.id)} aria-label={`Remover ${it.name}`} className="-mr-1 p-1.5 text-slate-300 active:text-rose-500 dark:text-slate-500"><X size={16} /></button>
                </li>
              ))}
              <li className="flex items-center justify-between gap-2 py-2.5 text-[12px]">
                <span className="font-bold uppercase tracking-wide muted">Total</span>
                <span className="tnum font-semibold">{fmt(t.kcal)} kcal · <span className="text-rose-500">P {fmt(t.protein)}</span> · <span className="text-amber-500">C {fmt(t.carbs)}</span> · <span className="text-violet-500">G {fmt(t.fat)}</span> · <span className="text-lime-600 dark:text-lime-400">F {fmt(t.fiber)}</span></span>
              </li>
            </ul>
          )}
          <button onClick={() => onAdd(meal)} className="btn-soft w-full !py-2.5"><Plus size={16} /> Adicionar alimento</button>
        </div>
      )}
    </section>
  )
}

function NewMealSheet({ open, onClose }) {
  const { addMeal } = useApp()
  const [name, setName] = useState('')
  const [time, setTime] = useState('15:00')
  return (
    <Sheet open={open} onClose={onClose} title="Nova refeição">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { addMeal(name.trim(), time); setName(''); onClose() } }}>
        <Field label="Nome" htmlFor="nm-name"><input id="nm-name" autoFocus className="input" placeholder="Ex.: Pré-treino" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2">
          {['Pré-treino', 'Pós-treino', 'Lanche extra', 'Brunch'].map((s) => <button type="button" key={s} className="chip" onClick={() => setName(s)}>{s}</button>)}
        </div>
        <Field label="Horário" htmlFor="nm-time"><input id="nm-time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        <button className="btn-primary w-full !py-3.5" disabled={!name.trim()}>Criar refeição</button>
      </form>
    </Sheet>
  )
}

function ActivitySheet({ open, onClose }) {
  const { addActivity, profile } = useApp()
  const [type, setType] = useState('musculacao')
  const [intensity, setIntensity] = useState('moderada')
  const [minutes, setMinutes] = useState(45)
  const kcal = activityKcal(type, intensity, minutes, profile.weight)
  const met = ACTIVITIES.find((a) => a.id === type).met[intensity]
  return (
    <Sheet open={open} onClose={onClose} title="Registrar atividade"
      footer={<button className="btn-primary w-full !py-3.5" disabled={minutes <= 0} onClick={() => { addActivity(type, intensity, minutes); onClose() }}><Flame size={16} /> Registrar · {fmt(kcal)} kcal</button>}>
      <p className="label mb-2">Tipo de atividade</p>
      <div className="grid grid-cols-3 gap-2">
        {ACTIVITIES.map((a) => {
          const I = ACT_ICON[a.icon] || Dumbbell
          const on = type === a.id
          return (
            <button key={a.id} onClick={() => setType(a.id)} aria-pressed={on}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-[12px] font-semibold transition active:scale-95 ${on ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'}`}>
              <I size={22} /> <span className="text-center leading-tight">{a.label}</span>
            </button>
          )
        })}
      </div>
      <p className="label mb-2 mt-5">Intensidade</p>
      <div className="seg">
        {INTENSITIES.map((i) => <button key={i.id} aria-pressed={intensity === i.id} onClick={() => setIntensity(i.id)}>{i.label}</button>)}
      </div>
      <div className="mt-5">
        <Field label="Duração (minutos)" htmlFor="act-min"><Stepper id="act-min" value={minutes} onChange={setMinutes} step={5} max={600} suffix="min" /></Field>
        <div className="mt-2 flex gap-2">{[15, 30, 45, 60, 90].map((m) => <button key={m} className={`chip flex-1 justify-center !px-0 ${minutes === m ? 'chip-on' : ''}`} onClick={() => setMinutes(m)}>{m}</button>)}</div>
      </div>
      <div className="mt-5 rounded-2xl bg-orange-50 p-4 dark:bg-orange-400/10">
        <p className="tnum font-display text-3xl font-extrabold text-orange-600 dark:text-orange-300">≈ {fmt(kcal)} kcal</p>
        <p className="mt-1 text-xs muted tnum">MET {fmt(met, 1)} × {fmt(profile.weight, 1)} kg × {fmt(minutes / 60, 2)} h · estimativa pelo Compêndio de Atividades Físicas</p>
      </div>
    </Sheet>
  )
}

function Activities() {
  const { day, totals, removeActivity } = useApp()
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-3">
      <section className="card flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white"><Flame size={26} /></div>
        <div className="flex-1">
          <p className="label">Gasto em atividades</p>
          <p className="tnum font-display text-3xl font-extrabold">{fmt(totals.burned)} <span className="text-sm font-semibold muted">kcal</span></p>
        </div>
        <div className="text-right"><p className="label">Tempo</p><p className="tnum font-bold">{day.activities.reduce((a, x) => a + x.minutes, 0)} min</p></div>
      </section>
      {day.activities.map((a) => {
        const def = ACTIVITIES.find((x) => x.id === a.type)
        const I = ACT_ICON[def?.icon] || Dumbbell
        return (
          <div key={a.id} className="card flex items-center gap-3 animate-fade-in">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300"><I size={20} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{def?.label}</p>
              <p className="text-xs muted"><Timer size={11} className="mr-0.5 inline" />{a.minutes} min · intensidade {INTENSITIES.find((i) => i.id === a.intensity)?.label.toLowerCase()}</p>
            </div>
            <span className="tnum font-display text-lg font-bold text-orange-600 dark:text-orange-300">{a.kcal}</span>
            <button onClick={() => removeActivity(a.id)} aria-label="Remover atividade" className="p-1.5 text-slate-300 active:text-rose-500 dark:text-slate-500"><Trash2 size={16} /></button>
          </div>
        )
      })}
      {day.activities.length === 0 && (
        <p className="px-4 py-6 text-center text-sm muted">Nenhum treino neste dia. As calorias gastas entram automaticamente no seu saldo do dashboard.</p>
      )}
      <button onClick={() => setOpen(true)} className="btn w-full bg-orange-500 !py-3.5 text-white shadow-sm shadow-orange-500/30"><Plus size={18} /> Registrar atividade</button>
      <ActivitySheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default function Diary({ initialSeg = 'refeicoes' }) {
  const { day, totals, goals } = useApp()
  const [seg, setSeg] = useState(initialSeg)
  const [foodMeal, setFoodMeal] = useState(null)
  const [newMeal, setNewMeal] = useState(false)

  return (
    <div>
      <Header title="Diário" subtitle={`${fmt(totals.kcal)} de ${fmt(goals.kcal)} kcal`} right={<DateSwitcher />} />
      <div className="seg mb-3">
        <button aria-pressed={seg === 'refeicoes'} onClick={() => setSeg('refeicoes')}>Alimentação</button>
        <button aria-pressed={seg === 'atividades'} onClick={() => setSeg('atividades')}>Atividades</button>
      </div>

      {seg === 'refeicoes' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['kcal', totals.kcal, goals.kcal, 'text-emerald-600 dark:text-emerald-400'], ['Prot.', totals.protein, goals.protein, 'text-rose-500'], ['Carb.', totals.carbs, goals.carbs, 'text-amber-500'], ['Gord.', totals.fat, goals.fat, 'text-violet-500']].map(([l, v, g, c]) => (
              <div key={l} className="rounded-2xl bg-white py-2 shadow-card dark:bg-white/5 dark:shadow-none">
                <p className={`tnum font-display text-[17px] font-bold ${c}`}>{fmt(v)}</p>
                <p className="text-[10px] font-semibold uppercase muted tnum">{l} / {fmt(g)}</p>
              </div>
            ))}
          </div>
          {day.meals.map((m) => <MealCard key={m.id} meal={m} onAdd={setFoodMeal} />)}
          <button onClick={() => setNewMeal(true)} className="btn w-full border-2 border-dashed border-slate-300 !py-3.5 text-slate-500 dark:border-white/15 dark:text-slate-400"><Plus size={18} /> Nova refeição personalizada</button>
        </div>
      ) : <Activities />}

      <FoodSheet open={!!foodMeal} meal={foodMeal} onClose={() => setFoodMeal(null)} />
      <NewMealSheet open={newMeal} onClose={() => setNewMeal(false)} />
    </div>
  )
}
