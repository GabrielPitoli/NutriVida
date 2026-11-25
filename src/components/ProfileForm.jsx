import { Check } from 'lucide-react'
import { Stepper, Field } from './ui'
import { GOALS, ACTIVITY_LEVELS } from '../lib/nutrition'

import { t } from '../i18n';

export function BodyFields({ p, set }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">{t('Sexo biológico')}</span>
        <div className="seg">
          <button type="button" aria-pressed={p.sex === 'F'} onClick={() => set({ sex: 'F' })}>{t('Feminino')}</button>
          <button type="button" aria-pressed={p.sex === 'M'} onClick={() => set({ sex: 'M' })}>{t('Masculino')}</button>
        </div>
      </div>
      <Field label={t('Idade')} htmlFor="pf-age"><Stepper id="pf-age" value={p.age} onChange={(v) => set({ age: v })} min={12} max={100} suffix="anos" /></Field>
      <Field label={t('Peso')} htmlFor="pf-weight"><Stepper id="pf-weight" value={p.weight} onChange={(v) => set({ weight: v })} step={0.5} min={30} max={300} suffix="kg" /></Field>
      <Field label={t('Altura')} htmlFor="pf-height"><Stepper id="pf-height" value={p.height} onChange={(v) => set({ height: v })} min={120} max={230} suffix="cm" /></Field>
    </div>
  );
}

export function ActivityPicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      {ACTIVITY_LEVELS.map((a) => {
        const on = value === a.id
        return (
          <button type="button" key={a.id} onClick={() => onChange(a.id)} aria-pressed={on}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.99] ${on ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-400/10' : 'border-transparent bg-white dark:bg-white/5'}`}>
            <div className="flex-1"><p className="text-[15px] font-semibold">{a.label}</p><p className="text-xs muted">{a.desc}</p></div>
            <span className="tnum text-xs font-bold muted">{t('×')}{a.factor}</span>
            <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>{on && <Check size={14} strokeWidth={3} />}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GoalPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {GOALS.map((g) => {
        const on = value === g.id
        const adj = g.adjust === 0 ? t('Manutenção') : `${g.adjust > 0 ? '+' : ''}${Math.round(g.adjust * 100)}% kcal`
        return (
          <button type="button" key={g.id} onClick={() => onChange(g.id)} aria-pressed={on}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[0.99] ${on ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-400/10' : 'border-transparent bg-white dark:bg-white/5'}`}>
            <span className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${g.color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{g.label}</p>
              <p className="text-xs muted">{adj} {t('· proteína')} {g.proteinPerKg} {t('g/kg')}</p>
            </div>
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>{on && <Check size={14} strokeWidth={3} />}</span>
          </button>
        );
      })}
    </div>
  );
}
