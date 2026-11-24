import { useMemo, useState } from 'react'
import { Search, Clock, Users, Coffee, UtensilsCrossed, Cookie, Moon, Zap, Check, ListChecks, CookingPot, Plus, Pencil, Trash2, Sparkles, ImagePlus, Loader2, X, Calculator, Lightbulb, BookHeart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import { Sheet, NutrientGrid, Stepper, Field } from '../components/ui'
import { useAIStatus } from '../components/AddFlows'
import { RECIPES, RECIPE_CATEGORIES, RECIPE_TAGS } from '../data/recipes'
import { FOODS } from '../data/foods'
import { fmt, nutrientsFor, sumNutrients } from '../lib/nutrition'
import { recipeFromIdea, coverDataUrl, aiErrorText } from '../lib/ai'
import { computeGrade } from '../lib/quality'
import { QualityFace, QualityBadge, QualityReasons } from '../components/Quality'

const gradeRecipe = (r) => (r.q ? { grade: r.q, reasons: [] } : computeGrade(r.nutrition))

const CAT_ICON = { cafe: Coffee, almoco: UtensilsCrossed, lanche: Cookie, jantar: Moon, treino: Zap }
const CAT_TO_MEAL = { cafe: 'cafe', almoco: 'almoco', lanche: 'lanche-tarde', jantar: 'jantar', treino: 'lanche-tarde' }
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const ingText = (i) => (typeof i === 'string' ? i : i.text)
const CAT_STYLE = {
  cafe: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  almoco: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  lanche: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  jantar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  treino: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
}

/** Ícone do tipo de refeição; nas receitas próprias com foto, mostra a foto da pessoa. */
function RecipeIcon({ r, size = 52 }) {
  const I = CAT_ICON[r.category] || CookingPot
  if (r.image) return <img src={r.image} alt="" className="shrink-0 rounded-2xl object-cover" style={{ width: size, height: size }} />
  return <span className={`grid shrink-0 place-items-center rounded-2xl ${CAT_STYLE[r.category] || CAT_STYLE.almoco}`} style={{ width: size, height: size }}><I size={size * 0.46} /></span>
}

function RecipeDetail({ recipe, onClose, onEdit }) {
  const { day, addFoods, deleteMyRecipe } = useApp()
  const [mealId, setMealId] = useState(CAT_TO_MEAL[recipe.category] || 'almoco')
  const [servings, setServings] = useState(1)
  const [checked, setChecked] = useState({})
  const [logged, setLogged] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const n = recipe.nutrition
  const scaled = Object.fromEntries(Object.entries(n).map(([k, v]) => [k, k === 'kcal' ? Math.round(v * servings) : Math.round(v * servings * 10) / 10]))
  const log = () => {
    addFoods(mealId, [{ name: recipe.name, recipeId: recipe.id, q: gradeRecipe(recipe).grade, portion: `${fmt(servings, 1)} porç${servings > 1 ? 'ões' : 'ão'}`, ...scaled }], 'Receita registrada no diário')
    setLogged(true)
    setTimeout(onClose, 700)
  }
  return (
    <Sheet open onClose={onClose} title={recipe.mine ? 'Minha receita' : 'Receita'} full
      footer={
        <div className="space-y-2">
          <div className="flex gap-2">
            <select id="recipe-meal" aria-label="Refeição" className="input !py-2.5 flex-1" value={mealId} onChange={(e) => setMealId(e.target.value)}>
              {day.meals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="w-40"><Stepper id="recipe-serv" value={servings} onChange={setServings} step={0.5} min={0.5} max={10} /></div>
          </div>
          <button onClick={log} disabled={logged} className="btn-primary w-full !py-3.5">
            {logged ? <><Check size={18} /> Registrado!</> : <>Registrar no meu dia · {fmt(scaled.kcal)} kcal</>}
          </button>
        </div>
      }>
      {recipe.image && <img src={recipe.image} alt={recipe.name} className="mb-3 aspect-[16/10] w-full rounded-3xl object-cover" />}
      <div className="flex items-start gap-3">
        {!recipe.image && <RecipeIcon r={recipe} size={48} />}
        <div className="min-w-0">
          <p className="label">{RECIPE_CATEGORIES.find((c) => c.id === recipe.category)?.label}</p>
          <h3 className="font-display text-[24px] font-extrabold leading-tight tracking-tight">{recipe.name}</h3>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm muted">
        <span className="inline-flex items-center gap-1"><Clock size={15} /> {recipe.time} min</span>
        <span className="inline-flex items-center gap-1"><Users size={15} /> Rende {recipe.servings} porç{recipe.servings > 1 ? 'ões' : 'ão'}</span>
      </div>
      <div className="mt-3"><QualityBadge grade={gradeRecipe(recipe).grade} /></div>
      <QualityReasons reasons={gradeRecipe(recipe).reasons} />
      {recipe.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.tags.map((t) => <span key={t} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{RECIPE_TAGS.find((x) => x.id === t)?.label}</span>)}
        </div>
      )}
      {recipe.mine && (
        <div className="mt-3 flex gap-2">
          <button className="btn-soft flex-1 !py-2" onClick={() => onEdit(recipe)}><Pencil size={15} /> Editar</button>
          <button className="btn-danger flex-1 !py-2" onClick={() => setConfirmDel(true)}><Trash2 size={15} /> Excluir</button>
        </div>
      )}

      <p className="label mb-2 mt-5">Tabela nutricional · por porção</p>
      <NutrientGrid n={n} />

      {recipe.ingredients?.length > 0 && <>
        <p className="label mb-2 mt-6">Ingredientes</p>
        <ul className="space-y-1">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              <button onClick={() => setChecked({ ...checked, [i]: !checked[i] })} className="flex w-full items-start gap-3 rounded-xl py-1.5 text-left">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${checked[i] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>{checked[i] && <Check size={13} strokeWidth={3} />}</span>
                <span className={`text-[15px] ${checked[i] ? 'line-through muted' : ''}`}>{ingText(ing)}</span>
              </button>
            </li>
          ))}
        </ul>
      </>}

      {recipe.steps?.length > 0 && <>
        <p className="label mb-3 mt-6 flex items-center gap-1.5"><ListChecks size={14} /> Modo de preparo</p>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">{i + 1}</span>
              <p className="pt-0.5 text-[15px] leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </>}

      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} title="Excluir receita?">
        <p className="text-sm muted">"{recipe.name}" será apagada de Minhas receitas. O que você já registrou no diário continua lá.</p>
        <div className="mt-4 space-y-2">
          <button className="btn w-full bg-rose-600 !py-3.5 text-white" onClick={() => { deleteMyRecipe(recipe.id); setConfirmDel(false); onClose() }}><Trash2 size={16} /> Excluir</button>
          <button className="btn-ghost w-full !py-3.5" onClick={() => setConfirmDel(false)}>Cancelar</button>
        </div>
      </Sheet>
    </Sheet>
  )
}

// ------------------------------------------------------------------ editor de receitas próprias
const emptyRecipe = () => ({ name: '', category: 'almoco', tags: [], time: 20, servings: 1, ingredients: [], steps: [], nutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, image: null, autoNutrition: true })

function IngredientPicker({ onAdd }) {
  const { customFoods } = useApp()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [g, setG] = useState(100)
  const list = useMemo(() => {
    const nq = norm(q.trim()); if (!nq) return []
    return [...customFoods, ...FOODS].filter((f) => norm(f.name).includes(nq)).slice(0, 6)
  }, [q, customFoods])
  if (sel) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2 dark:bg-emerald-400/10">
        <span className="min-w-0 flex-1 truncate pl-2 text-sm font-semibold">{sel.name}</span>
        <input aria-label="Gramas" inputMode="numeric" className="input w-20 !px-2 !py-2 text-right tnum" value={g} onChange={(e) => setG(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
        <span className="text-xs muted">g</span>
        <button className="btn-primary !px-3 !py-2" disabled={!g} onClick={() => { onAdd({ text: `${g} g de ${sel.name.toLowerCase()}`, n: nutrientsFor(sel.per100, g) }); setSel(null); setQ(''); setG(100) }}><Check size={16} /></button>
        <button className="p-1 text-slate-400" aria-label="Cancelar" onClick={() => setSel(null)}><X size={16} /></button>
      </div>
    )
  }
  return (
    <div className="relative">
      <Calculator size={16} className="absolute left-3.5 top-3.5 text-emerald-500" />
      <input id="ing-search" className="input pl-10" placeholder="Buscar no banco de alimentos (calcula sozinho)" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a2b25]">
          {list.map((f) => <li key={f.id}><button className="w-full px-4 py-2.5 text-left text-sm active:bg-slate-50 dark:active:bg-white/5" onClick={() => { setSel(f); setG(f.unit?.grams || 100) }}>{f.name} <span className="text-xs muted">· {fmt(f.per100.kcal)} kcal/100 g</span></button></li>)}
        </ul>
      )}
    </div>
  )
}

function RecipeEditor({ initial, onClose, onSaved }) {
  const { saveMyRecipe } = useApp()
  const { ai } = useAIStatus()
  const [r, setR] = useState(() => (initial ? { autoNutrition: initial.ingredients?.some((i) => i.n), ...initial } : emptyRecipe()))
  const [idea, setIdea] = useState('')
  const [aiState, setAiState] = useState('')
  const [freeIng, setFreeIng] = useState('')
  const [freeStep, setFreeStep] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const set = (patch) => setR((x) => ({ ...x, ...patch }))

  const linked = r.ingredients.filter((i) => i.n)
  const auto = r.autoNutrition && linked.length > 0
  const autoN = useMemo(() => {
    const t = sumNutrients(linked.map((i) => i.n)), s = Math.max(1, r.servings)
    return { kcal: Math.round(t.kcal / s), protein: Math.round(t.protein / s * 10) / 10, carbs: Math.round(t.carbs / s * 10) / 10, fat: Math.round(t.fat / s * 10) / 10, fiber: Math.round(t.fiber / s * 10) / 10 }
  }, [linked, r.servings])
  const nutrition = auto ? autoN : r.nutrition

  const generate = async () => {
    setAiState('working')
    try {
      const g = await recipeFromIdea(idea.trim())
      setR((x) => ({ ...x, ...g, ingredients: g.ingredients.map((t) => ({ text: t })), autoNutrition: false, image: x.image }))
      setAiState('done')
    } catch (e) { setAiState(aiErrorText(e)) }
  }
  const pickPhoto = async (f) => { if (!f) return; setPhotoBusy(true); try { set({ image: await coverDataUrl(f) }) } finally { setPhotoBusy(false) } }
  const save = () => {
    const out = { ...r, nutrition, name: r.name.trim(), hue: r.hue ?? Math.floor(Math.random() * 360) }
    onSaved(saveMyRecipe(out))
  }
  const valid = r.name.trim() && nutrition.kcal >= 0

  return (
    <Sheet open onClose={onClose} title={initial ? 'Editar receita' : 'Nova receita'} full
      footer={<button className="btn-primary w-full !py-3.5" disabled={!valid} onClick={save}><Check size={18} /> Salvar receita</button>}>
      <div className="space-y-5">
        {!initial && ai && (
          <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 text-white">
            <p className="flex items-center gap-2 font-display font-bold"><Sparkles size={18} /> Tem uma ideia? A IA monta a receita</p>
            <textarea id="recipe-idea" rows={2} className="mt-2 w-full resize-none rounded-2xl border-0 bg-white/15 px-3 py-2 text-[14px] text-white placeholder:text-white/70 outline-none focus:bg-white/25"
              placeholder="Ex.: bolo de caneca de banana sem açúcar e com whey" value={idea} onChange={(e) => setIdea(e.target.value)} />
            <button disabled={!idea.trim() || aiState === 'working'} onClick={generate} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-sm font-bold text-violet-700 disabled:opacity-60">
              {aiState === 'working' ? <><Loader2 size={16} className="animate-spin" /> Criando receita…</> : <><Lightbulb size={16} /> Criar com IA</>}
            </button>
            {aiState === 'done' && <p className="mt-2 text-[12px] text-white/90">Pronto! Revise e ajuste abaixo antes de salvar.</p>}
            {aiState && !['working', 'done'].includes(aiState) && <p className="mt-2 text-[12px] text-white">{aiState}</p>}
          </div>
        )}

        <label className="relative block cursor-pointer overflow-hidden rounded-3xl">
          {r.image ? <img src={r.image} alt="Foto da receita" className="aspect-[16/10] w-full object-cover" /> : (
            <div className="grid aspect-[16/10] place-items-center border-2 border-dashed border-slate-300 bg-white text-slate-500 dark:border-white/15 dark:bg-white/5">
              <span className="flex flex-col items-center gap-1 text-sm font-semibold">{photoBusy ? <Loader2 className="animate-spin" /> : <ImagePlus size={28} />} Adicionar foto</span>
            </div>
          )}
          {r.image && <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white">Trocar foto</span>}
          <input id="recipe-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>

        <Field label="Nome da receita" htmlFor="recipe-name"><input id="recipe-name" className="input" placeholder="Ex.: Panqueca da vovó versão fit" value={r.name} onChange={(e) => set({ name: e.target.value })} /></Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Tipo de refeição</span>
          <div className="flex flex-wrap gap-2">{RECIPE_CATEGORIES.map((c) => <button key={c.id} className={`chip ${r.category === c.id ? 'chip-on' : ''}`} onClick={() => set({ category: c.id })}>{c.label}</button>)}</div>
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-600 dark:text-slate-300">Características</span>
          <div className="flex flex-wrap gap-2">{RECIPE_TAGS.map((t) => { const on = r.tags.includes(t.id); return <button key={t.id} aria-pressed={on} className={`chip ${on ? 'chip-on' : ''}`} onClick={() => set({ tags: on ? r.tags.filter((x) => x !== t.id) : [...r.tags, t.id] })}>{t.label}</button> })}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tempo (min)" htmlFor="recipe-time"><Stepper id="recipe-time" value={r.time} onChange={(v) => set({ time: v })} step={5} min={1} max={600} /></Field>
          <Field label="Rende (porções)" htmlFor="recipe-servings"><Stepper id="recipe-servings" value={r.servings} onChange={(v) => set({ servings: Math.max(1, Math.round(v)) })} min={1} max={50} /></Field>
        </div>

        <div>
          <p className="label mb-2">Ingredientes</p>
          <ul className="mb-2 space-y-1.5">
            {r.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 dark:bg-white/5">
                <span className="min-w-0 flex-1 text-[14px]">{ingText(ing)}{ing.n && <span className="ml-1 text-[11px] font-semibold text-emerald-600 tnum">· {fmt(ing.n.kcal)} kcal</span>}</span>
                <button aria-label="Remover ingrediente" className="p-1 text-slate-400" onClick={() => set({ ingredients: r.ingredients.filter((_, j) => j !== i) })}><X size={16} /></button>
              </li>
            ))}
          </ul>
          <IngredientPicker onAdd={(ing) => set({ ingredients: [...r.ingredients, ing] })} />
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (freeIng.trim()) { set({ ingredients: [...r.ingredients, { text: freeIng.trim() }] }); setFreeIng('') } }}>
            <input id="ing-free" className="input" placeholder="Ou escreva livre: sal, temperos…" value={freeIng} onChange={(e) => setFreeIng(e.target.value)} />
            <button className="btn-ghost !px-3" aria-label="Adicionar ingrediente"><Plus size={18} /></button>
          </form>
        </div>

        <div>
          <p className="label mb-2">Modo de preparo</p>
          <ol className="mb-2 space-y-1.5">
            {r.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 rounded-2xl bg-white px-3 py-2 dark:bg-white/5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">{i + 1}</span>
                <span className="min-w-0 flex-1 text-[14px]">{s}</span>
                <button aria-label="Remover passo" className="p-1 text-slate-400" onClick={() => set({ steps: r.steps.filter((_, j) => j !== i) })}><X size={16} /></button>
              </li>
            ))}
          </ol>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (freeStep.trim()) { set({ steps: [...r.steps, freeStep.trim()] }); setFreeStep('') } }}>
            <input id="step-free" className="input" placeholder={`Passo ${r.steps.length + 1}`} value={freeStep} onChange={(e) => setFreeStep(e.target.value)} />
            <button className="btn-ghost !px-3" aria-label="Adicionar passo"><Plus size={18} /></button>
          </form>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Nutrição por porção</p>
            {linked.length > 0 && (
              <label className="flex items-center gap-2 text-[12px] font-semibold">
                <input id="auto-nutri" type="checkbox" className="h-4 w-4 accent-emerald-600" checked={r.autoNutrition} onChange={(e) => set({ autoNutrition: e.target.checked, nutrition: autoN })} /> Calcular pelos ingredientes
              </label>
            )}
          </div>
          {auto ? (
            <><NutrientGrid n={autoN} /><p className="mt-1.5 text-[11px] muted">Soma dos ingredientes do banco ÷ {r.servings} porç{r.servings > 1 ? 'ões' : 'ão'}.</p></>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {[['kcal', 'kcal'], ['protein', 'Prot.'], ['carbs', 'Carb.'], ['fat', 'Gord.'], ['fiber', 'Fibras']].map(([k, l]) => (
                <label key={k} className="text-center">
                  <input id={'rn-' + k} inputMode="decimal" className="input !px-1 !py-2 text-center text-sm font-bold tnum" value={r.nutrition[k]}
                    onChange={(e) => set({ nutrition: { ...r.nutrition, [k]: parseFloat(e.target.value.replace(',', '.')) || 0 } })} />
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase muted">{l}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}

// ------------------------------------------------------------------ página
export default function Recipes() {
  const { myRecipes } = useApp()
  const [seg, setSeg] = useState('dicas')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('todas')
  const [tag, setTag] = useState(null)
  const [open, setOpen] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | recipe

  const source = seg === 'dicas' ? RECIPES : myRecipes
  const list = useMemo(() => {
    const nq = norm(q.trim())
    return source.filter((r) => (cat === 'todas' || r.category === cat) && (!tag || r.tags?.includes(tag)) && (!nq || norm(r.name + ' ' + (r.ingredients || []).map(ingText).join(' ')).includes(nq)))
  }, [source, q, cat, tag])

  return (
    <div>
      <Header title="Receitas" subtitle={`${RECIPES.length} dicas · ${myRecipes.length} suas`}
        right={<button onClick={() => setEditing('new')} className="btn-primary !rounded-full !px-3.5 !py-2"><Plus size={16} /> Nova</button>} />
      <div className="seg mb-3">
        <button aria-pressed={seg === 'dicas'} onClick={() => setSeg('dicas')}>Dicas</button>
        <button aria-pressed={seg === 'minhas'} onClick={() => setSeg('minhas')}><BookHeart size={14} className="mr-1 inline" />Minhas receitas</button>
      </div>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input id="recipe-search" className="input pl-11" placeholder="Buscar receita ou ingrediente" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        <button className={`chip ${cat === 'todas' ? 'chip-on' : ''}`} onClick={() => setCat('todas')}>Todas</button>
        {RECIPE_CATEGORIES.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'chip-on' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>)}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
        {RECIPE_TAGS.map((t) => (
          <button key={t.id} onClick={() => setTag(tag === t.id ? null : t.id)} aria-pressed={tag === t.id}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tag === t.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200/60 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {seg === 'minhas' && myRecipes.length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-white/15">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><Lightbulb size={26} /></span>
          <p className="mt-3 font-display text-lg font-bold">Suas receitas ficam aqui</p>
          <p className="mt-1 text-sm muted">Cadastre aquela receita de família, uma ideia que inventou ou peça para a IA montar uma a partir de uma ideia. As calorias são calculadas pelos ingredientes.</p>
          <button className="btn-primary mt-4" onClick={() => setEditing('new')}><Plus size={16} /> Criar minha receita</button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((r) => (
            <li key={r.id}>
              <button onClick={() => setOpen(r)} className="card flex w-full items-center gap-3 !p-3 text-left transition active:scale-[0.99]">
                <RecipeIcon r={r} />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">{r.name}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] muted tnum">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(r.nutrition.kcal)} kcal</span>
                    <span className="inline-flex items-center gap-0.5"><Clock size={12} />{r.time} min</span>
                    <span className="font-semibold text-rose-500">P {fmt(r.nutrition.protein)} g</span>
                    {r.mine && <span className="rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">Minha</span>}
                  </p>
                </div>
                <QualityFace grade={gradeRecipe(r).grade} size={24} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {list.length === 0 && !(seg === 'minhas' && myRecipes.length === 0) && <p className="py-12 text-center text-sm muted">Nenhuma receita com esses filtros.</p>}
      {open && <RecipeDetail recipe={open} onClose={() => setOpen(null)} onEdit={(rec) => { setOpen(null); setEditing(rec) }} />}
      {editing && <RecipeEditor initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(rec) => { setEditing(null); setSeg('minhas'); setOpen(rec) }} />}
    </div>
  )
}
