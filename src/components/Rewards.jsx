import { useState } from 'react'
import { Flame, Zap, Trophy, Lock, Check, Sprout, Crown, Droplets, Beef, Target, Dumbbell, Star, ChefHat, Lightbulb, Medal, ChevronRight, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Sheet } from './ui'
import { MISSIONS, DAY_TARGET, PERFECT_BONUS } from '../lib/rewards'
import { addDays, todayKey, fromKey } from '../lib/dates'
import { fmt } from '../lib/nutrition'

const ICONS = { Sprout, Flame, Crown, Droplets, Beef, Target, Dumbbell, Star, ChefHat, Lightbulb, Medal }

function FlameIcon({ on, size = 22 }) {
  return <Flame size={size} className={on ? 'fill-orange-400 text-orange-500' : 'text-slate-300 dark:text-slate-600'} />
}

function Week() {
  const { rewards } = useApp()
  const t = todayKey()
  const keys = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6))
  return (
    <div className="flex justify-between">
      {keys.map((k) => {
        const e = rewards.evals[k]
        const on = e?.secured
        const isToday = k === t
        return (
          <div key={k} className="flex flex-col items-center gap-1">
            <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-orange-500' : 'muted'}`}>{fromKey(k).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}</span>
            <span className={`grid h-9 w-9 place-items-center rounded-full ${on ? 'bg-orange-500 text-white' : isToday ? 'border-2 border-dashed border-orange-300 dark:border-orange-400/40' : 'bg-slate-100 dark:bg-white/5'}`}>
              {on ? <Check size={18} strokeWidth={3} /> : <span className="text-[11px] font-bold muted tnum">{e?.count || ''}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function MissionList({ compact }) {
  const { rewards } = useApp()
  const e = rewards.today
  return (
    <ul className="space-y-2.5">
      {MISSIONS.map((m) => {
        const done = e.done[m.id]
        const pct = Math.min(100, Math.round((e.progress[m.id] || 0) * 100))
        return (
          <li key={m.id} className="flex items-center gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${done ? 'animate-pop text-white' : 'bg-slate-100 dark:bg-white/5'}`} style={done ? { background: m.color } : undefined}>
              {done ? <Check size={18} strokeWidth={3} /> : <span className="text-[10px] font-bold muted tnum">{pct}%</span>}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`truncate text-[13.5px] font-semibold ${done ? 'muted line-through decoration-2' : ''}`}>{m.label}</p>
                <span className="shrink-0 text-[11px] font-bold text-amber-500 tnum">+{m.xp} XP</span>
              </div>
              {!compact && <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: pct + '%', background: m.color }} /></div>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function RewardsSheet({ open, onClose }) {
  const { rewards } = useApp()
  const unlocked = rewards.badges.filter((b) => b.unlocked).length
  return (
    <Sheet open={open} onClose={onClose} title="Conquistas" full>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 p-5 text-white">
        <Flame size={140} className="absolute -right-6 -top-4 fill-white/15 text-white/20" />
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-orange-100">Ofensiva</p>
        <p className="font-display text-[56px] font-extrabold leading-none tnum">{rewards.streak}<span className="ml-2 text-xl">dia{rewards.streak === 1 ? '' : 's'}</span></p>
        <p className="mt-2 text-[13px] text-orange-50">
          {rewards.todaySecured ? 'Dia de hoje garantido. Volte amanhã para continuar!' : `Cumpra ${DAY_TARGET} missões hoje para ${rewards.streak ? 'não perder sua ofensiva' : 'começar uma ofensiva'}.`}
        </p>
        <p className="mt-1 text-[12px] text-orange-100">Recorde: {rewards.best} dia{rewards.best === 1 ? '' : 's'}</p>
      </div>
      <div className="card mt-3"><Week /></div>

      <div className="card mt-3">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-2xl font-extrabold text-amber-950">{rewards.level}</span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">{rewards.title}</p>
            <p className="text-xs muted tnum">{fmt(rewards.xp)} XP no total · faltam {fmt(rewards.xpForNext - rewards.xpInLevel)} para o nível {rewards.level + 1}</p>
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-[width] duration-700" style={{ width: rewards.pct * 100 + '%' }} /></div>
      </div>

      <h3 className="mb-2 mt-5 flex items-center justify-between px-1 font-display text-lg font-bold">Missões de hoje <span className="text-sm font-semibold muted tnum">{rewards.today.count}/{MISSIONS.length}</span></h3>
      <div className="card"><MissionList />
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-[12px] text-amber-900 dark:bg-amber-400/10 dark:text-amber-200"><Star size={14} className="shrink-0 fill-amber-400 text-amber-400" /> Dia perfeito (5 de 5): +{PERFECT_BONUS} XP bônus. Cada registro também vale +2 XP (até 20 por dia).</p>
      </div>

      <h3 className="mb-2 mt-5 flex items-center justify-between px-1 font-display text-lg font-bold">Medalhas <span className="text-sm font-semibold muted tnum">{unlocked}/{rewards.badges.length}</span></h3>
      <div className="grid grid-cols-3 gap-2">
        {rewards.badges.map((b) => {
          const I = ICONS[b.icon] || Medal
          return (
            <div key={b.id} className={`flex flex-col items-center rounded-2xl p-3 text-center ${b.unlocked ? 'bg-white shadow-card dark:bg-white/5' : 'bg-slate-100/70 dark:bg-white/[0.02]'}`}>
              <span className={`relative grid h-14 w-14 place-items-center rounded-full ${b.unlocked ? 'bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500'}`}>
                <I size={24} />
                {!b.unlocked && <Lock size={12} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-slate-400 p-0.5 text-white dark:bg-slate-600" />}
              </span>
              <p className="mt-2 text-[12px] font-bold leading-tight">{b.title}</p>
              <p className="mt-0.5 text-[10.5px] leading-tight muted">{b.desc}</p>
              {!b.unlocked && b.goal > 1 && <p className="mt-1 text-[10px] font-bold text-amber-600 tnum">{b.value}/{b.goal}</p>}
            </div>
          )
        })}
      </div>
      <p className="mt-4 flex gap-2 px-1 text-[11px] muted"><ShieldCheck size={14} className="shrink-0" /> Missões e XP são calculados a partir dos seus registros e valem para qualquer aparelho em que você abrir o app.</p>
    </Sheet>
  )
}

/** Faixa compacta no topo do dashboard. */
export default function RewardsStrip() {
  const { rewards } = useApp()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="card flex w-full items-center gap-3 !py-3 text-left active:scale-[0.99]" aria-label="Ver conquistas">
        <span className="flex items-center gap-1">
          <FlameIcon on={rewards.todaySecured || rewards.streak > 0} size={26} />
          <span className={`font-display text-xl font-extrabold tnum ${rewards.streak ? 'text-orange-500' : 'muted'}`}>{rewards.streak}</span>
        </span>
        <span className="h-8 w-px bg-slate-200 dark:bg-white/10" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between text-[12px] font-bold">
            <span className="flex items-center gap-1"><Zap size={13} className="fill-amber-400 text-amber-500" />Nível {rewards.level} · {rewards.title}</span>
            <span className="muted tnum">{rewards.today.count}/{MISSIONS.length} missões</span>
          </span>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5"><span className="block h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-[width] duration-700" style={{ width: rewards.pct * 100 + '%' }} /></span>
        </span>
        <Trophy size={18} className="text-amber-500" />
      </button>
      {!rewards.todaySecured && rewards.streak > 0 && new Date().getHours() >= 18 && (
        <p className="-mt-1 px-2 text-center text-[12px] font-semibold text-orange-600 dark:text-orange-400">Sua ofensiva de {rewards.streak} dia{rewards.streak > 1 ? 's' : ''} está em risco: faltam {DAY_TARGET - rewards.today.count} missão(ões).</p>
      )}
      <RewardsSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
