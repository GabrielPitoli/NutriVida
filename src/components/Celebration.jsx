import { useEffect, useMemo } from 'react'
import { Droplets, Trophy, Beef, Utensils, Check, Flame, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'

const KIND = {
  water: { icon: Droplets, grad: 'from-sky-400 to-blue-600', colors: ['#38bdf8', '#0ea5e9', '#7dd3fc', '#ffffff'] },
  protein: { icon: Beef, grad: 'from-rose-400 to-pink-600', colors: ['#fb7185', '#f43f5e', '#fda4af', '#fde68a'] },
  kcal: { icon: Trophy, grad: 'from-emerald-400 to-teal-600', colors: ['#34d399', '#10b981', '#fde047', '#a7f3d0'] },
  meals: { icon: Utensils, grad: 'from-amber-400 to-orange-600', colors: ['#fbbf24', '#f97316', '#fde68a', '#34d399'] },
  streak: { icon: Flame, grad: 'from-orange-400 to-rose-500', colors: ['#fb923c', '#f97316', '#fde047', '#f43f5e'] },
  level: { icon: Zap, grad: 'from-amber-300 to-amber-500', colors: ['#fcd34d', '#f59e0b', '#fde68a', '#ffffff'] },
}

function Confetti({ colors }) {
  const bits = useMemo(() => Array.from({ length: 42 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 42 + Math.random() * 0.4
    const d = 120 + Math.random() * 160
    return {
      dx: Math.cos(a) * d, dy: Math.sin(a) * d - 60, rot: Math.random() * 720 - 360,
      c: colors[i % colors.length], w: 6 + Math.random() * 6, delay: Math.random() * 0.12, round: i % 3 === 0,
    }
  }), [colors])
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2">
      {bits.map((b, i) => (
        <span key={i} className="absolute block animate-confetti"
          style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--rot': `${b.rot}deg`, width: b.w, height: b.round ? b.w : b.w * 0.45, background: b.c, borderRadius: b.round ? 99 : 2, animationDelay: `${b.delay}s` }} />
      ))}
    </div>
  )
}

export default function Celebration() {
  const { celebration, setCelebration, toast, setToast, xpGain, setXpGain } = useApp()
  useEffect(() => {
    if (!xpGain) return
    const t = setTimeout(() => setXpGain(null), 1400)
    return () => clearTimeout(t)
  }, [xpGain, setXpGain])

  useEffect(() => {
    if (!celebration) return
    const t = setTimeout(() => setCelebration(null), 2600)
    return () => clearTimeout(t)
  }, [celebration, setCelebration])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast, setToast])

  const k = celebration && (KIND[celebration.kind] || KIND.kcal)
  const TIcon = toast?.tone === 'activity' ? Flame : Check

  return (
    <>
      {xpGain && !celebration && (
        <div key={xpGain.id} aria-live="polite" className="pointer-events-none fixed z-[61] animate-[xp_1.4s_ease-out_forwards] rounded-full bg-amber-400 px-3 py-1.5 font-display text-sm font-extrabold text-amber-950 shadow-lg"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 150px)', right: 'max(24px, calc(50vw - 216px))' }}>
          +{xpGain.amount} XP
        </div>
      )}
      {toast && !celebration && (
        <div key={toast.id} role="status" className="fixed left-1/2 z-[60] flex max-w-[92vw] animate-toast-in items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 py-2.5 pl-2.5 pr-4 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', transform: 'translateX(-50%)' }}>
          <span className={`grid h-6 w-6 place-items-center rounded-full ${toast.tone === 'activity' ? 'bg-orange-500' : 'bg-emerald-500'} text-white`}><TIcon size={14} strokeWidth={3} /></span>
          {toast.msg}
        </div>
      )}
      {celebration && (
        <div key={celebration.id} className="fixed inset-0 z-[70] grid animate-fade-in place-items-center bg-slate-950/30 p-6 backdrop-blur-[1px]" onClick={() => setCelebration(null)} role="alert">
          <Confetti colors={k.colors} />
          <div className="relative w-full max-w-[320px] animate-pop rounded-[28px] bg-white p-6 text-center shadow-2xl dark:bg-[#12201b]">
            <div className={`mx-auto -mt-14 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br ${k.grad} text-white shadow-lg ring-8 ring-white dark:ring-[#12201b]`}>
              <k.icon size={36} />
            </div>
            <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight">{celebration.title}</h3>
            <p className="mt-1 text-sm muted">{celebration.sub}</p>
          </div>
        </div>
      )}
    </>
  )
}
