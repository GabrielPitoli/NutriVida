import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, SmartphoneNfc, SlidersHorizontal, RotateCcw, Cloud, HardDrive, Scale, Utensils, Monitor, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header, { SyncBadge } from '../components/Header'
import { Field, Sheet } from '../components/ui'
import { BodyFields, ActivityPicker, GoalPicker } from '../components/ProfileForm'
import GoalsResult from '../components/GoalsResult'
import { bmi, fmt } from '../lib/nutrition'

function Section({ title, children, icon: I }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 px-1 font-display text-lg font-bold tracking-tight">{I && <I size={18} className="text-emerald-600 dark:text-emerald-400" />}{title}</h2>
      {children}
    </section>
  )
}

function ManualGoals() {
  const { profile, updateProfile, calculated } = useApp()
  const on = !!profile.manual
  const m = profile.manual || {}
  const fields = [['kcal', 'Calorias', 'kcal'], ['protein', 'Proteínas', 'g'], ['carbs', 'Carboidratos', 'g'], ['fat', 'Gorduras', 'g'], ['water', 'Água', 'ml'], ['fiber', 'Fibras', 'g']]
  const toggle = (v) => updateProfile({ manual: v ? { kcal: calculated.kcal, protein: calculated.protein, carbs: calculated.carbs, fat: calculated.fat, water: calculated.water, fiber: calculated.fiber } : null })
  return (
    <div className="card">
      <label className="flex cursor-pointer items-center gap-3">
        <SlidersHorizontal size={18} className="text-emerald-600 dark:text-emerald-400" />
        <span className="flex-1"><b className="text-[15px]">Ajustar metas manualmente</b><br /><span className="text-xs muted">Use se seu nutricionista passou valores específicos</span></span>
        <input id="manual-toggle" type="checkbox" className="peer sr-only" checked={on} onChange={(e) => toggle(e.target.checked)} />
        <span className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 dark:bg-white/20 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
      </label>
      {on && (
        <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-in">
          {fields.map(([k, l, u]) => (
            <Field key={k} label={`${l} (${u})`} htmlFor={'mg-' + k} hint={`Calculado: ${fmt(calculated[k])}`}>
              <input id={'mg-' + k} className="input tnum" inputMode="numeric" value={m[k] ?? ''} onChange={(e) => updateProfile({ manual: { ...m, [k]: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 } })} />
            </Field>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const { profile, updateProfile, goals, calculated, settings, setTheme, resetDay, syncStatus } = useApp()
  const [draft, setDraft] = useState(profile)
  const [confirmReset, setConfirmReset] = useState(false)
  const timer = useRef()
  useEffect(() => { setDraft(profile) }, [profile])
  // Salva automaticamente após pequena pausa (evita uma escrita por clique)
  const set = (patch) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => updateProfile(patch.weight ? { ...next } : next), 400)
  }
  const b = bmi(draft.weight, draft.height)
  const cloud = syncStatus === 'synced' || syncStatus === 'saving'

  return (
    <div>
      <Header title="Metas e perfil" subtitle={profile.name || 'Seu plano personalizado'} />

      <GoalsResult profile={draft} goals={{ ...goals, ...(profile.manual ? {} : {}) }} calc={calculated} />
      {profile.manual && <p className="mt-2 px-1 text-xs font-semibold text-amber-600">Metas manuais ativas — o cálculo automático está como referência.</p>}

      <Section title="Seus dados" icon={Scale}>
        <div className="card space-y-4">
          <Field label="Como quer ser chamado(a)?" htmlFor="pf-name"><input id="pf-name" className="input" placeholder="Seu nome" value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <BodyFields p={draft} set={set} />
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-sm muted">IMC</span>
            <span className="tnum text-sm"><b className="font-display text-lg">{fmt(b.value, 1)}</b> · {b.label}</span>
          </div>
        </div>
      </Section>

      <Section title="Nível de atividade"><ActivityPicker value={draft.activity} onChange={(v) => set({ activity: v })} /></Section>
      <Section title="Objetivo principal"><GoalPicker value={draft.goal} onChange={(v) => set({ goal: v })} /></Section>

      <Section title="Refeições por dia" icon={Utensils}>
        <div className="card">
          <div className="flex gap-2">
            {[3, 4, 5, 6].map((n) => <button key={n} onClick={() => set({ mealsPerDay: n })} className={`chip flex-1 justify-center ${draft.mealsPerDay === n ? 'chip-on' : ''}`}>{n}</button>)}
          </div>
          <p className="mt-2 text-xs muted">Usado no contador de refeições do dashboard.</p>
        </div>
      </Section>

      <Section title="Ajuste fino"><ManualGoals /></Section>

      <Section title="Aparência">
        <div className="seg">
          <button aria-pressed={settings.theme === 'light'} onClick={() => setTheme('light')}><Sun size={14} className="mr-1 inline" />Claro</button>
          <button aria-pressed={settings.theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={14} className="mr-1 inline" />Escuro</button>
          <button aria-pressed={settings.theme === 'system'} onClick={() => setTheme('system')}><Monitor size={14} className="mr-1 inline" />Sistema</button>
        </div>
      </Section>

      <Section title="Seus dados salvos">
        <div className="card space-y-3">
          <div className="flex items-start gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cloud ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{cloud ? <Cloud size={20} /> : <HardDrive size={20} />}</span>
            <div className="text-[13px]">
              <SyncBadge />
              <p className="mt-0.5 muted">{cloud
                ? 'Perfil, refeições, água e treinos ficam no banco de dados na nuvem, privados para você, e também neste aparelho para funcionar offline.'
                : 'Perfil, refeições, água e treinos ficam salvos neste aparelho e continuam lá ao fechar o app.'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300"><SmartphoneNfc size={20} /></span>
            <p className="text-[13px] muted">Para instalar como aplicativo: no navegador do celular, toque em <b>Compartilhar → Adicionar à Tela de Início</b> (iPhone) ou <b>⋮ → Instalar app</b> (Android).</p>
          </div>
          <button className="btn-danger w-full" onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> Limpar registros do dia selecionado</button>
        </div>
      </Section>

      <p className="mt-6 px-2 pb-4 text-center text-[11px] muted">As metas são estimativas com base em fórmulas científicas e não substituem a orientação de um(a) nutricionista ou médico(a).</p>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Limpar o dia?">
        <p className="text-sm muted">Todas as refeições, água e atividades do dia selecionado serão apagadas. Seu perfil e outros dias continuam salvos.</p>
        <div className="mt-4 space-y-2">
          <button className="btn w-full bg-rose-600 !py-3.5 text-white" onClick={() => { resetDay(); setConfirmReset(false) }}><Trash2 size={16} /> Limpar dia</button>
          <button className="btn-ghost w-full !py-3.5" onClick={() => setConfirmReset(false)}>Cancelar</button>
        </div>
      </Sheet>
    </div>
  )
}
