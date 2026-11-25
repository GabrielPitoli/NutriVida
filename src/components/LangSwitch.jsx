import { Languages } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { LANGS } from '../i18n'

/** Seletor de idioma. `compact` = botão PT/EN para a tela de boas-vindas. */
export default function LangSwitch({ compact }) {
  const { lang, setLanguage } = useApp()
  if (compact) {
    const next = lang === 'en' ? 'pt' : 'en'
    return (
      <button onClick={() => setLanguage(next)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/70 px-3 py-1.5 text-[12px] font-bold dark:bg-white/10" aria-label={lang === 'en' ? 'Mudar para português' : 'Switch to English'}>
        <Languages size={14} /> {LANGS.find((l) => l.id === next).label}
      </button>
    )
  }
  return (
    <div className="seg">
      {LANGS.map((l) => <button key={l.id} aria-pressed={lang === l.id} onClick={() => setLanguage(l.id)}>{l.label}</button>)}
    </div>
  )
}
