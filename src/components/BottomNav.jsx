import { Home, NotebookPen, ChefHat, CalendarRange, UserRound } from 'lucide-react'

export const TABS = [
  { id: 'hoje', label: 'Hoje', icon: Home },
  { id: 'diario', label: 'Diário', icon: NotebookPen },
  { id: 'receitas', label: 'Receitas', icon: ChefHat },
  { id: 'cardapios', label: 'Cardápios', icon: CalendarRange },
  { id: 'perfil', label: 'Metas', icon: UserRound },
]

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1a16]/85"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
      <ul className="mx-auto flex max-w-[480px] justify-around px-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = tab === id
          return (
            <li key={id} className="flex-1">
              <button onClick={() => onChange(id)} aria-current={on ? 'page' : undefined}
                className={`group flex w-full flex-col items-center gap-0.5 pb-2 pt-2 text-[11px] font-semibold transition ${on ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-all duration-300 ${on ? 'bg-emerald-100 dark:bg-emerald-400/15' : 'group-active:bg-slate-100 dark:group-active:bg-white/5'}`}>
                  <Icon size={21} strokeWidth={on ? 2.4 : 2} />
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
