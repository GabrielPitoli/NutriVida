import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronLeft, PencilLine, Star, Trash2 } from 'lucide-react'
import { Sheet, Stepper, NutrientGrid, Field } from './ui'
import { FOODS, FOOD_CATEGORIES } from '../data/foods'
import { nutrientsFor, fmt } from '../lib/nutrition'
import { gradeFood } from '../lib/quality'
import { loadProducts } from '../lib/products'
import { QualityFace, QualityBadge, QualityReasons } from './Quality'
import { useApp } from '../context/AppContext'
import { useAddFlow } from './AddFlows'
import { ScanBarcode, Camera, Sparkles } from 'lucide-react'

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function PortionEditor({ food, onBack, onAdd, backLabel = 'Voltar à busca' }) {
  const [mode, setMode] = useState(food.unit ? 'unit' : 'g')
  const [qty, setQty] = useState(food.unit ? 1 : 100)
  const grams = mode === 'unit' ? qty * food.unit.grams : qty
  const n = nutrientsFor(food.per100, grams)
  const switchMode = (m) => { setMode(m); setQty(m === 'unit' ? 1 : (food.unit?.grams || 100)) }
  const quality = gradeFood(food)
  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><ChevronLeft size={16} /> {backLabel}</button>
      <p className="label">{food.category}</p>
      <h3 className="font-display text-2xl font-bold tracking-tight">{food.name}</h3>
      <div className="mt-2"><QualityBadge grade={quality.grade} /></div>
      <QualityReasons reasons={quality.reasons} />
      <p className="mt-1 text-xs muted tnum">Por 100 g: {fmt(food.per100.kcal)} kcal · P {fmt(food.per100.protein, 1)} · C {fmt(food.per100.carbs, 1)} · G {fmt(food.per100.fat, 1)}</p>

      {food.unit && (
        <div className="seg mt-4">
          <button aria-pressed={mode === 'unit'} onClick={() => switchMode('unit')}>{food.unit.label} ({food.unit.grams} g)</button>
          <button aria-pressed={mode === 'g'} onClick={() => switchMode('g')}>Gramas</button>
        </div>
      )}
      <div className="mt-4">
        <Field label={mode === 'unit' ? `Quantidade (${food.unit.label})` : 'Quantidade em gramas / ml'} htmlFor="portion-qty">
          <Stepper id="portion-qty" value={qty} onChange={setQty} step={mode === 'unit' ? 0.5 : 10} suffix={mode === 'g' ? 'g' : ''} />
        </Field>
        {mode === 'unit' && <p className="mt-1.5 text-xs muted tnum">= {fmt(grams)} g</p>}
      </div>
      <NutrientGrid n={n} className="mt-4" />
      <button className="btn-primary mt-5 w-full !py-3.5" disabled={grams <= 0}
        onClick={() => onAdd({ foodId: food.id, q: quality.grade, name: food.name, grams, portion: mode === 'unit' ? `${fmt(qty, 1)} ${food.unit.label}` : null, ...n })}>
        Adicionar · {fmt(n.kcal)} kcal
      </button>
    </div>
  )
}

export function ManualFood({ onSave, initial, submitLabel = 'Continuar' }) {
  const [f, setF] = useState(() => {
    const base = { name: '', grams: 100, kcal: '', protein: '', carbs: '', fat: '', fiber: '', save: true }
    if (!initial) return base
    const g = initial.portionGrams || 100, k = g / 100, r = (v) => String(Math.round(v * k * 10) / 10)
    return { ...base, name: initial.name || '', grams: g, kcal: r(initial.per100.kcal), protein: r(initial.per100.protein), carbs: r(initial.per100.carbs), fat: r(initial.per100.fat), fiber: r(initial.per100.fiber) }
  })
  const num = (v) => parseFloat(String(v).replace(',', '.')) || 0
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const valid = f.name.trim() && num(f.grams) > 0 && num(f.kcal) >= 0 && f.kcal !== ''
  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const g = num(f.grams)
    const per100 = { kcal: num(f.kcal) / g * 100, protein: num(f.protein) / g * 100, carbs: num(f.carbs) / g * 100, fat: num(f.fat) / g * 100, fiber: num(f.fiber) / g * 100 }
    onSave({ name: f.name.trim(), per100, unit: { label: 'porção', grams: g } }, f.save)
  }
  const fields = [['kcal', 'Calorias (kcal)'], ['protein', 'Proteínas (g)'], ['carbs', 'Carboidratos (g)'], ['fat', 'Gorduras (g)'], ['fiber', 'Fibras (g)']]
  return (
    <form onSubmit={submit} className="space-y-3 animate-fade-in">
      <Field label="Nome do alimento" htmlFor="mf-name"><input id="mf-name" className="input" placeholder="Ex.: Bolo de cenoura caseiro" value={f.name} onChange={set('name')} /></Field>
      <Field label="Tamanho da porção (g ou ml)" htmlFor="mf-grams"><input id="mf-grams" className="input" inputMode="decimal" value={f.grams} onChange={set('grams')} /></Field>
      <p className="label pt-1">Valores nutricionais da porção</p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([k, l]) => (
          <Field key={k} label={l} htmlFor={'mf-' + k}><input id={'mf-' + k} className="input" inputMode="decimal" placeholder="0" value={f[k]} onChange={set(k)} /></Field>
        ))}
      </div>
      <label className="flex items-center gap-2 pt-1 text-sm">
        <input id="mf-save" type="checkbox" checked={f.save} onChange={set('save')} className="h-5 w-5 accent-emerald-600" /> Salvar em "Meus alimentos" para usar depois
      </label>
      <button className="btn-primary w-full !py-3.5" disabled={!valid}>{submitLabel}</button>
    </form>
  )
}

export default function FoodSheet({ open, onClose, meal }) {
  const { addFoods, customFoods, addCustomFood, removeCustomFood } = useApp()
  const flow = useAddFlow()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todos')
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('buscar')

  const all = useMemo(() => [...customFoods, ...FOODS], [customFoods])
  const [products, setProducts] = useState(null)
  useEffect(() => { if (open && q.trim().length >= 3 && !products) loadProducts().then(setProducts) }, [open, q, products])
  const productHits = useMemo(() => {
    const nq = norm(q.trim())
    if (!products || nq.length < 3 || (cat !== 'Todos' && cat !== 'Produtos')) return []
    const words = nq.split(/\s+/)
    const out = []
    for (const p of products.list) { const n = norm(p.name); if (words.every((w) => n.includes(w))) { out.push(p); if (out.length >= 20) break } }
    return out
  }, [products, q, cat])
  const cats = useMemo(() => ['Todos', ...(customFoods.length ? ['Meus alimentos'] : []), ...FOOD_CATEGORIES], [customFoods])
  const list = useMemo(() => {
    const nq = norm(q.trim())
    return all.filter((f) => (cat === 'Todos' || f.category === cat) && (!nq || norm(f.name).includes(nq)))
  }, [all, q, cat])

  const close = () => { setSel(null); setQ(''); setTab('buscar'); onClose() }
  const add = (item) => { addFoods(meal.id, [item], `${item.name} adicionado`); setSel(null) }

  return (
    <Sheet open={open} onClose={close} title={meal ? `Adicionar ao ${meal.name.toLowerCase()}` : 'Adicionar'} full>
      {sel ? (
        <PortionEditor food={sel} onBack={() => setSel(null)} onAdd={add} />
      ) : (
        <>
          <div className="seg mb-3">
            <button aria-pressed={tab === 'buscar'} onClick={() => setTab('buscar')}><Search size={14} className="mr-1 inline" />Buscar</button>
            <button aria-pressed={tab === 'manual'} onClick={() => setTab('manual')}><PencilLine size={14} className="mr-1 inline" />Cadastrar</button>
          </div>
          {tab === 'manual' ? (
            <ManualFood onSave={(food, save) => { const f = save ? addCustomFood(food) : { ...food, id: 'tmp', category: 'Avulso' }; setTab('buscar'); setSel(f) }} />
          ) : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {[['plate', Camera, 'Foto do prato', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'], ['barcode', ScanBarcode, 'Código de barras', 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300'], ['chat', Sparkles, 'Falar com a IA', 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300']].map(([m, I, l, c]) => (
                  <button key={m} onClick={() => { const id = meal.id; close(); flow.open(m, id) }} className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-[12px] font-bold active:scale-95 ${c}`}><I size={20} />{l}</button>
                ))}
              </div>
              <div className="sticky top-0 z-10 -mx-5 bg-[var(--bg)] px-5 pb-2">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="food-search" className="input pl-11" placeholder="Buscar arroz, frango, banana…" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
                  {cats.map((c) => <button key={c} className={`chip !py-1.5 ${cat === c ? 'chip-on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
                </div>
              </div>
              <ul className="mt-1 divide-y divide-slate-200/70 dark:divide-white/5">
                {list.map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <button onClick={() => setSel(f)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left active:opacity-60">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[15px] font-semibold"><QualityFace grade={gradeFood(f).grade} size={16} /><span className="truncate">{f.custom && <Star size={12} className="mr-1 inline fill-amber-400 text-amber-400" />}{f.name}</span></p>
                        <p className="text-xs muted tnum">{f.unit ? `1 ${f.unit.label} (${f.unit.grams} g) · ${fmt(f.per100.kcal * f.unit.grams / 100)} kcal` : `100 g · ${fmt(f.per100.kcal)} kcal`}</p>
                      </div>
                      <span className="tnum shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">P {fmt(f.per100.protein, 1)}</span>
                    </button>
                    {f.custom && <button onClick={() => removeCustomFood(f.id)} aria-label={`Excluir ${f.name}`} className="p-2 text-slate-400"><Trash2 size={16} /></button>}
                  </li>
                ))}
              </ul>
              {productHits.length > 0 && (
                <>
                  <p className="label mb-1 mt-4">Produtos industrializados</p>
                  <ul className="divide-y divide-slate-200/70 dark:divide-white/5">
                    {productHits.map((f) => (
                      <li key={f.id}>
                        <button onClick={() => setSel(f)} className="flex w-full items-center gap-3 py-3 text-left active:opacity-60">
                          <QualityFace grade={gradeFood(f).grade} size={16} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14.5px] font-semibold">{f.name}</p>
                            <p className="text-xs muted tnum">100 g · {fmt(f.per100.kcal)} kcal{f.nutriscore ? ` · Nutri-Score ${f.nutriscore.toUpperCase()}` : ''}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {q.trim().length >= 3 && !products && <p className="py-3 text-center text-xs muted">Buscando também em produtos industrializados…</p>}
              {list.length === 0 && productHits.length === 0 && (
                <div className="py-10 text-center">
                  <p className="font-semibold">Nenhum alimento encontrado</p>
                  <p className="mt-1 text-sm muted">Cadastre "{q}" com os valores do rótulo.</p>
                  <button className="btn-soft mt-3" onClick={() => setTab('manual')}><PencilLine size={16} /> Cadastrar alimento</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Sheet>
  )
}
