import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Celebration from './components/Celebration'
import Onboarding from './components/Onboarding'
import { AddFlowProvider, QuickAddButton } from './components/AddFlows'
import Dashboard from './pages/Dashboard'
import Diary from './pages/Diary'
import Recipes from './pages/Recipes'
import MealPlans from './pages/MealPlans'
import Profile from './pages/Profile'

const VALID = ['hoje', 'diario', 'receitas', 'cardapios', 'perfil']
const initialTab = () => { const h = location.hash.slice(1); return VALID.includes(h) ? h : 'hoje' }

function Shell() {
  const { profile } = useApp()
  const [tab, setTab] = useState(initialTab)
  const [diarySeg, setDiarySeg] = useState('refeicoes')
  const go = (t, seg) => {
    if (t === 'diario') setDiarySeg(seg || 'refeicoes')
    setTab(t)
    try { history.replaceState(null, '', '#' + t) } catch { /* iframe sandbox */ }
    window.scrollTo({ top: 0 })
  }
  return (
    <>
      <main className="mx-auto min-h-[100dvh] max-w-[480px]"
        style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        <div key={tab + diarySeg} className="animate-fade-in">
          {tab === 'hoje' && <Dashboard go={go} />}
          {tab === 'diario' && <Diary initialSeg={diarySeg} />}
          {tab === 'receitas' && <Recipes />}
          {tab === 'cardapios' && <MealPlans go={go} />}
          {tab === 'perfil' && <Profile />}
        </div>
      </main>
      {(tab === 'hoje' || tab === 'diario') && <QuickAddButton />}
      <BottomNav tab={tab} onChange={(t) => go(t)} />
      <Celebration />
      {!profile.onboarded && <Onboarding />}
    </>
  )
}

// Trocar o idioma remonta a interface, e todos os textos são lidos de novo no idioma novo
function LangRoot() {
  const { lang } = useApp()
  return <AddFlowProvider key={lang}><Shell /></AddFlowProvider>
}

export default function App() {
  return <AppProvider><LangRoot /></AppProvider>
}
