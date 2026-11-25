import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, Leaf } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BodyFields, ActivityPicker, GoalPicker } from './ProfileForm'
import GoalsResult from './GoalsResult'
import LangSwitch from './LangSwitch'
import { calculateGoals } from '../lib/nutrition'

import { t } from '../i18n';

const STEPS = ['Bem-vindo', 'Seu corpo', 'Rotina', 'Objetivo', 'Resultado']

export default function Onboarding() {
  const { profile, updateProfile } = useApp()
  const [step, setStep] = useState(0)
  const [p, setP] = useState(profile)
  const set = (patch) => setP((x) => ({ ...x, ...patch }))
  const calc = calculateGoals(p)
  const finish = () => updateProfile({ ...p, onboarded: true })
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o } }, [])
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish())

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[var(--bg)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-5 pb-5 pt-4" style={{ paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))', paddingRight: 'max(20px, env(safe-area-inset-right, 0px))' }}>
        {step > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(step - 1)} aria-label={t('Voltar')} className="grid h-9 w-9 place-items-center rounded-full bg-slate-200/70 dark:bg-white/10"><ChevronLeft size={18} /></button>
            <div className="flex flex-1 gap-1.5">{STEPS.slice(1).map((s, i) => <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />)}</div>
            <button onClick={finish} className="text-sm font-semibold muted">{t('Pular')}</button>
          </div>
        )}

        <div key={step} className="flex-1 animate-fade-in pt-6">
          {step === 0 && (
            <div className="flex min-h-[70dvh] flex-col justify-center">
              <div className="-mt-2 mb-6 flex justify-end"><LangSwitch compact /></div>
              <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-lg shadow-emerald-600/30"><Leaf size={40} /></div>
              <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight">{t('Comida, água e treino no mesmo lugar.')}</h1>
              <p className="mt-3 text-[16px] muted">{t(
                'Responda 3 perguntas rápidas e o NutriVida calcula quantas calorias, proteínas e quanta água você precisa por dia.'
              )}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-[12px] font-semibold">
                {[t('Meta calórica automática'), t('Foto do prato com IA'), t('Código de barras'), t('+40 receitas'), t('Ofensiva e medalhas')].map((t) => <span key={t} className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">{t}</span>)}
              </div>
            </div>
          )}
          {step === 1 && (<><h2 className="font-display text-3xl font-extrabold tracking-tight">{t('Sobre você')}</h2><p className="mb-5 mt-1 text-sm muted">{t(
            'Usamos esses dados na fórmula de Mifflin-St Jeor para estimar seu metabolismo.'
          )}</p><BodyFields p={p} set={set} /></>)}
          {step === 2 && (<><h2 className="font-display text-3xl font-extrabold tracking-tight">{t('Sua rotina')}</h2><p className="mb-5 mt-1 text-sm muted">{t('Quanto você se movimenta numa semana típica?')}</p><ActivityPicker value={p.activity} onChange={(v) => set({ activity: v })} /></>)}
          {step === 3 && (<><h2 className="font-display text-3xl font-extrabold tracking-tight">{t('Seu objetivo')}</h2><p className="mb-5 mt-1 text-sm muted">{t('Isso define o ajuste de calorias e a quantidade de proteína.')}</p><GoalPicker value={p.goal} onChange={(v) => set({ goal: v })} /></>)}
          {step === 4 && (<><h2 className="font-display text-3xl font-extrabold tracking-tight">{t('Seu plano diário')}</h2><p className="mb-5 mt-1 text-sm muted">{t('Você pode ajustar tudo depois na aba Metas.')}</p><GoalsResult profile={p} goals={calc} calc={calc} /></>)}
        </div>

        <button onClick={next} className="btn-primary mt-6 w-full !py-4 text-[15px]">
          {step === 0 ? t('Calcular minhas metas') : step === STEPS.length - 1 ? t('Começar a usar') : t('Continuar')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
