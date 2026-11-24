import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ScanBarcode, Sparkles, Search, ImagePlus, Loader2, X, Mic, Send, Keyboard, RefreshCw, Check, AlertCircle, Bot, Plus, Square } from 'lucide-react'
import { Sheet, MacroDots } from './ui'
import FoodSheet, { PortionEditor, ManualFood } from './FoodSheet'
import { useApp } from '../context/AppContext'
import { getAI, getDictation, analyzePlate, readLabel, chat, aiErrorText, shrinkImage } from '../lib/ai'
import { decodeFromFile, startLiveScan, lookupOpenFoodFacts, validEan } from '../lib/barcode'
import { fmt, sumNutrients } from '../lib/nutrition'
import { gradeItem } from '../lib/quality'
import { QualityFace } from './Quality'
import { findProduct } from '../lib/products'

// ------------------------------------------------------------------ contexto dos fluxos
const FlowCtx = createContext({ open: () => {} })
export const useAddFlow = () => useContext(FlowCtx)

/** Refeição mais provável pelo horário atual. */
export function guessMeal(meals) {
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes()
  let best = meals[0]
  for (const m of meals) {
    if (!m.time) continue
    const [h, mm] = m.time.split(':').map(Number)
    if (h * 60 + mm - 45 <= mins) best = m
  }
  return best?.id
}

export function useAIStatus() {
  const [s, setS] = useState({ loading: true, ai: null })
  useEffect(() => { let on = true; getAI().then((ai) => on && setS({ loading: false, ai })); return () => { on = false } }, [])
  return s
}

function MealSelect({ value, onChange, id }) {
  const { day } = useApp()
  return (
    <select id={id} aria-label="Refeição" className="input !py-2.5" value={value} onChange={(e) => onChange(e.target.value)}>
      {day.meals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  )
}

function AIUnavailable() {
  return (
    <div className="rounded-2xl bg-amber-50 p-4 text-[13px] text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
      <p className="flex items-center gap-2 font-bold"><AlertCircle size={16} /> IA indisponível aqui</p>
      <p className="mt-1">A IA funciona quando você abre o NutriVida pelo link do claude.ai, com sua conta conectada. Você ainda pode buscar o alimento ou cadastrar manualmente.</p>
    </div>
  )
}

/** Lista editável de alimentos sugeridos pela IA: ajusta gramas (recalcula proporcionalmente) e remove itens. */
function FoodReview({ foods, setFoods }) {
  const setGrams = (i, g) => setFoods(foods.map((f, j) => {
    if (j !== i) return f
    const base = f._base || f
    const k = base.grams ? g / base.grams : 1
    const r = (v) => Math.round(v * k * 10) / 10
    return { ...f, _base: base, grams: g, portion: null, kcal: Math.round(base.kcal * k), protein: r(base.protein), carbs: r(base.carbs), fat: r(base.fat), fiber: r(base.fiber) }
  }))
  return (
    <ul className="space-y-2">
      {foods.map((f, i) => (
        <li key={i} className="rounded-2xl bg-white p-3 dark:bg-white/5">
          <div className="flex items-start gap-2">
            <p className="flex min-w-0 flex-1 items-center gap-1.5 text-[14px] font-semibold leading-snug"><QualityFace grade={gradeItem(f)} size={16} /><span>{f.name}</span></p>
            <button onClick={() => setFoods(foods.filter((_, j) => j !== i))} aria-label={`Remover ${f.name}`} className="-mr-1 -mt-1 p-1 text-slate-400"><X size={16} /></button>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative w-[84px] shrink-0">
              <input aria-label={`Gramas de ${f.name}`} inputMode="numeric" className="input !py-1.5 !pl-2 !pr-6 text-right text-sm tnum" value={f.grams || ''}
                onChange={(e) => setGrams(i, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] muted">g</span>
            </div>
            <p className="min-w-0 flex-1 text-[11.5px] leading-tight muted tnum">{f.portion ? <>{f.portion}<br /></> : null}<MacroDots it={f} /></p>
            <span className="shrink-0 text-sm font-bold tnum">{fmt(f.kcal)} <span className="text-[10px] font-semibold muted">kcal</span></span>
          </div>
        </li>
      ))}
    </ul>
  )
}

const stripBase = (foods) => foods.map(({ _base, ...f }) => f)

// ------------------------------------------------------------------ Foto do prato
function PlateSheet({ open, onClose, mealId: initialMeal }) {
  const { addFoods } = useApp()
  const { loading, ai } = useAIStatus()
  const [mealId, setMealId] = useState(initialMeal)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [hint, setHint] = useState('')
  const [state, setState] = useState('idle') // idle | working | done | error
  const [result, setResult] = useState(null)
  const [foods, setFoods] = useState([])
  const [err, setErr] = useState('')
  const ctl = useRef(null)
  useEffect(() => setMealId(initialMeal), [initialMeal])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const reset = () => { ctl.current?.abort(); setFile(null); setPreview(null); setState('idle'); setResult(null); setFoods([]); setHint(''); setErr('') }
  const close = () => { reset(); onClose() }
  const pick = (f) => { if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); setState('idle'); setFoods([]) }
  const run = async () => {
    setState('working'); setErr('')
    ctl.current = new AbortController()
    try {
      const small = await shrinkImage(file, 1280)
      const r = await analyzePlate(small, hint.trim(), ctl.current.signal)
      setResult(r); setFoods(r.foods); setState('done')
    } catch (e) { if (e?.code !== 'cancelled') { setErr(aiErrorText(e)); setState('error') } else setState('idle') }
  }
  const total = sumNutrients(foods)

  return (
    <Sheet open={open} onClose={close} title="Foto do prato" full
      footer={state === 'done' && foods.length > 0 && (
        <div className="flex gap-2">
          <div className="w-[46%]"><MealSelect id="plate-meal" value={mealId} onChange={setMealId} /></div>
          <button className="btn-primary flex-1" onClick={() => { addFoods(mealId, stripBase(foods), `${foods.length} alimentos adicionados`); close() }}>
            <Check size={16} /> Adicionar {fmt(total.kcal)} kcal
          </button>
        </div>
      )}>
      {loading ? <Loader2 className="mx-auto my-10 animate-spin text-emerald-500" /> : !ai || !ai.images ? <AIUnavailable /> : (
        <div className="space-y-4">
          {!preview ? (
            <>
              <p className="text-sm muted">Tire uma foto da sua refeição e a IA identifica os alimentos e estima as porções. Depois é só conferir e ajustar.</p>
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 text-emerald-700 active:scale-[0.99] dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:text-emerald-300">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><Camera size={30} /></span>
                <span className="font-bold">Tirar foto</span>
                <input id="plate-camera" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
              <label className="btn-ghost w-full cursor-pointer"><ImagePlus size={16} /> Escolher da galeria
                <input id="plate-gallery" type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
              <p className="text-center text-[11px] muted">Dica: fotografe de cima, com boa luz e o prato inteiro.</p>
            </>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-3xl">
                <img src={preview} alt="Foto da refeição" className="aspect-[4/3] w-full object-cover" />
                {state === 'working' && (
                  <div className="absolute inset-0 grid place-items-center bg-slate-950/40 text-white">
                    <div className="text-center"><Loader2 size={34} className="mx-auto animate-spin" /><p className="mt-2 text-sm font-semibold">Analisando seu prato…</p></div>
                    <div className="absolute inset-x-0 top-0 h-1 animate-[wave_1.6s_linear_infinite] bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
                  </div>
                )}
                <button onClick={reset} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white" aria-label="Trocar foto"><RefreshCw size={16} /></button>
              </div>
              {state !== 'done' && (
                <>
                  <input id="plate-hint" className="input" placeholder="Opcional: detalhes (ex.: arroz integral, frango grelhado)" value={hint} onChange={(e) => setHint(e.target.value)} />
                  {state === 'working'
                    ? <button className="btn-ghost w-full" onClick={() => ctl.current?.abort()}><Square size={14} /> Parar</button>
                    : <button className="btn-primary w-full !py-3.5" onClick={run}><Sparkles size={16} /> Identificar alimentos</button>}
                </>
              )}
              {err && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{err}</p>}
              {state === 'done' && (
                <div className="animate-fade-in space-y-3">
                  <div className="flex items-start gap-2">
                    <Bot size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <p className="text-sm">{result.description}{result.confidence && <span className="muted"> · confiança {result.confidence}</span>}</p>
                  </div>
                  {foods.length ? <FoodReview foods={foods} setFoods={setFoods} /> : <p className="text-sm muted">Nenhum alimento identificado. Tente outra foto.</p>}
                  <p className="text-[11px] muted">Porções estimadas pela imagem. Ajuste as gramas se souber o valor exato.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}

// ------------------------------------------------------------------ Código de barras
function BarcodeSheet({ open, onClose, mealId: initialMeal }) {
  const { addFoods, customFoods, addCustomFood } = useApp()
  const { ai } = useAIStatus()
  const [mealId, setMealId] = useState(initialMeal)
  const [stage, setStage] = useState('scan') // scan | looking | found | notfound | label | manual
  const [code, setCode] = useState('')
  const [typed, setTyped] = useState('')
  const [food, setFood] = useState(null)
  const [live, setLive] = useState(false)
  const [msg, setMsg] = useState('')
  const [labelDraft, setLabelDraft] = useState(null)
  // Dentro do claude.ai a câmera ao vivo é bloqueada pelo navegador; usamos a câmera nativa (foto).
  const liveOk = !!navigator.mediaDevices?.getUserMedia && !window.claude
  const video = useRef(null)
  const stopRef = useRef(null)
  useEffect(() => setMealId(initialMeal), [initialMeal])

  const stopLive = () => { stopRef.current?.(); stopRef.current = null; setLive(false) }
  const reset = () => { stopLive(); setStage('scan'); setCode(''); setTyped(''); setFood(null); setMsg(''); setLabelDraft(null) }
  const close = () => { reset(); onClose() }
  useEffect(() => () => stopRef.current?.(), [])

  const lookup = async (c) => {
    stopLive()
    if (!validEan(c)) { setMsg('Código inválido. Confira os números embaixo das barras.'); return }
    setCode(c); setStage('looking'); setMsg('')
    const mine = customFoods.find((f) => f.barcode === c)
    if (mine) { setFood(mine); setStage('found'); return }
    const local = await findProduct(c)
    if (local) { setFood(local); setStage('found'); return }
    const off = await lookupOpenFoodFacts(c)
    if (off) { setFood(addCustomFood({ ...off, unit: off.portionGrams ? { label: 'porção', grams: off.portionGrams } : null, barcode: c })); setStage('found'); return }
    setStage('notfound')
  }

  const startCam = async () => {
    setMsg('')
    try {
      setLive(true)
      await new Promise((r) => requestAnimationFrame(r))
      stopRef.current = await startLiveScan(video.current, (c) => { if (navigator.vibrate) navigator.vibrate(60); lookup(c) })
    } catch {
      setLive(false)
      setMsg('Não foi possível abrir a câmera ao vivo. Use "Tirar foto do código".')
    }
  }
  const fromPhoto = async (f) => {
    if (!f) return
    setMsg('Lendo o código…')
    try { await lookup(await decodeFromFile(f)) } catch { setMsg('Não consegui ler o código nessa foto. Dicas: deixe as barras na horizontal, ocupando boa parte da foto, com luz e sem reflexo. Ou digite os números que ficam embaixo das barras.') }
  }
  const fromLabel = async (f) => {
    if (!f) return
    setStage('label'); setMsg('')
    try { setLabelDraft(await readLabel(await shrinkImage(f, 1600))); setStage('manual') }
    catch (e) { setMsg(aiErrorText(e)); setStage('notfound') }
  }

  return (
    <Sheet open={open} onClose={close} title="Código de barras" full>
      {stage === 'scan' && (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-900">
            <video ref={video} className={`h-full w-full object-cover ${live ? '' : 'hidden'}`} muted playsInline />
            {!live && <div className="absolute inset-0 grid place-items-center text-slate-400"><ScanBarcode size={64} strokeWidth={1.2} /></div>}
            <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.35)]">
              {live && <div className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-rose-500" />}
            </div>
          </div>
          {liveOk && (live
            ? <button className="btn-ghost w-full" onClick={stopLive}>Parar câmera</button>
            : <button className="btn-primary w-full !py-3.5" onClick={startCam}><Camera size={16} /> Escanear ao vivo</button>)}
          <label className={`${liveOk ? 'btn-soft' : 'btn-primary !py-3.5'} w-full cursor-pointer`}><Camera size={16} /> Tirar foto do código
            <input id="barcode-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { fromPhoto(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {!liveOk && <p className="text-center text-[11.5px] muted">A câmera do celular abre: fotografe o código de perto e confirme a foto.</p>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); lookup(typed.trim()) }}>
            <div className="relative flex-1">
              <Keyboard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="barcode-typed" className="input pl-10 tnum" inputMode="numeric" placeholder="Ou digite os números" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))} />
            </div>
            <button className="btn-ghost" disabled={typed.length < 8}>Buscar</button>
          </form>
          {msg && <p className="rounded-2xl bg-slate-100 p-3 text-sm dark:bg-white/5">{msg}</p>}
        </div>
      )}
      {stage === 'looking' && <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-emerald-500" size={32} /><p className="mt-3 text-sm muted">Procurando o produto {code}…</p></div>}
      {stage === 'label' && <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-violet-500" size={32} /><p className="mt-3 text-sm muted">A IA está lendo a tabela nutricional…</p></div>}
      {stage === 'found' && food && (
        <>
          <div className="mb-3"><MealSelect id="barcode-meal" value={mealId} onChange={setMealId} /></div>
          <PortionEditor food={food} backLabel="Escanear outro" onBack={reset} onAdd={(it) => { addFoods(mealId, [it], `${it.name} adicionado`); close() }} />
        </>
      )}
      {stage === 'notfound' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5">
            <p className="font-bold">Código {code} lido, mas o produto não está na base</p>
            <p className="mt-1 text-sm muted">Tire uma foto da tabela nutricional da embalagem que a IA preenche tudo. Você só cadastra uma vez: nas próximas leituras, ele aparece na hora.</p>
          </div>
          {ai?.images && (
            <label className="btn w-full cursor-pointer bg-violet-600 !py-3.5 text-white"><Sparkles size={16} /> Fotografar a tabela nutricional (IA)
              <input id="label-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => fromLabel(e.target.files?.[0])} />
            </label>
          )}
          <button className="btn-ghost w-full" onClick={() => setStage('manual')}><Keyboard size={16} /> Digitar os valores do rótulo</button>
          <button className="w-full py-2 text-sm font-semibold muted" onClick={reset}>Escanear outro código</button>
          {msg && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{msg}</p>}
        </div>
      )}
      {stage === 'manual' && (
        <>
          {labelDraft && <p className="mb-3 flex items-center gap-2 rounded-2xl bg-violet-50 p-3 text-[13px] text-violet-800 dark:bg-violet-400/10 dark:text-violet-200"><Sparkles size={15} /> Valores lidos pela IA. Confira antes de salvar.</p>}
          <ManualFood initial={labelDraft} submitLabel="Salvar produto" onSave={(f) => { setFood(addCustomFood({ ...f, extra: labelDraft?.extra, barcode: code })); setStage('found') }} />
        </>
      )}
    </Sheet>
  )
}

// ------------------------------------------------------------------ Chat com a IA
const SUGGESTIONS = ['Comi 2 ovos mexidos e 1 pão francês com café', 'O que comer no lanche para bater minha proteína?', 'Almocei arroz, feijão, bife e salada', 'Sugira um jantar leve com o que falta hoje']

function ChatSheet({ open, onClose, mealId: initialMeal }) {
  const { profile, goals, totals, day, addFoods } = useApp()
  const { loading, ai } = useAIStatus()
  const [msgs, setMsgs] = useState([]) // {role, content, foods?, meal?, added?}
  const [text, setText] = useState('')
  const [partial, setPartial] = useState('')
  const [busy, setBusy] = useState(false)
  const [dict, setDict] = useState(null)
  const [listening, setListening] = useState(false)
  const ctl = useRef(null)
  const end = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { getDictation().then(setDict) }, [])
  useEffect(() => {
    if (!dict) return
    const a = dict.onFinal(({ text: t }) => setText((v) => (v ? v + t : t.trimStart())))
    const b = dict.onPartial(({ text: t }) => setPartial(t))
    const c = dict.onState(({ state }) => { setListening(state !== 'idle'); if (state === 'idle') setPartial('') })
    return () => { a(); b(); c() }
  }, [dict])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])

  const context = useMemo(() => ({
    profile: `${profile.name || 'sem nome'}, ${profile.sex === 'F' ? 'mulher' : 'homem'}, ${profile.age} anos, ${profile.weight} kg, ${profile.height} cm, objetivo: ${profile.goal}`,
    goals: `${goals.kcal} kcal, proteína ${goals.protein} g, carboidratos ${goals.carbs} g, gorduras ${goals.fat} g, água ${goals.water} ml`,
    today: `${totals.kcal} kcal, proteína ${totals.protein} g, carboidratos ${totals.carbs} g, gorduras ${totals.fat} g, água ${totals.water} ml, treino ${totals.burned} kcal`,
    meals: day.meals.map((m) => `${m.id} (${m.name} ${m.time || ''}${m.items.length ? ', já tem ' + m.items.map((i) => i.name).join('/') : ''})`).join('; '),
  }), [profile, goals, totals, day])

  const send = async (content) => {
    const c = (content ?? text).trim()
    if (!c || busy) return
    if (listening) dict?.stop()
    setText('')
    const history = [...msgs, { role: 'user', content: c }]
    setMsgs(history); setBusy(true)
    ctl.current = new AbortController()
    try {
      const turns = history.slice(-12).map((m) => ({ role: m.role, content: m.role === 'assistant' ? JSON.stringify({ reply: m.content, foods: (m.foods || []).map((f) => f.name) }) : m.content }))
      const r = await chat(turns, context, { signal: ctl.current.signal })
      const meal = day.meals.some((m) => m.id === r.meal) ? r.meal : initialMeal || guessMeal(day.meals)
      setMsgs((x) => [...x, { role: 'assistant', content: r.reply || 'Pronto!', foods: r.foods, meal }])
    } catch (e) {
      if (e?.code !== 'cancelled') setMsgs((x) => [...x, { role: 'assistant', content: aiErrorText(e), error: true }])
    } finally { setBusy(false) }
  }
  const updateMsg = (i, patch) => setMsgs((x) => x.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  return (
    <Sheet open={open} onClose={() => { ctl.current?.abort(); if (listening) dict?.stop(); onClose() }} title="Nutri IA" full
      footer={ai && (
        <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-end gap-2">
          {dict && (
            <button type="button" aria-label={listening ? 'Parar de ouvir' : 'Falar'} aria-pressed={listening}
              onClick={() => (listening ? dict.stop() : dict.start({ language: 'pt-BR' }).catch(() => {}))}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition ${listening ? 'animate-pulse bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}><Mic size={20} /></button>
          )}
          <textarea ref={inputRef} id="chat-input" rows={1} className="input max-h-28 min-h-[48px] resize-none !py-3" placeholder={listening ? 'Ouvindo…' : 'O que você comeu?'}
            value={text + (partial ? (text ? ' ' : '') + partial : '')} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          {busy
            ? <button type="button" onClick={() => ctl.current?.abort()} aria-label="Parar" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"><Square size={16} /></button>
            : <button aria-label="Enviar" disabled={!text.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white disabled:opacity-40"><Send size={18} /></button>}
        </form>
      )}>
      {loading ? <Loader2 className="mx-auto my-10 animate-spin text-violet-500" /> : !ai ? <AIUnavailable /> : (
        <div className="space-y-3 pb-2">
          {msgs.length === 0 && (
            <div className="animate-fade-in">
              <div className="flex items-start gap-3 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 text-white">
                <Bot size={26} className="shrink-0" />
                <p className="text-[14px]">Oi! Sou a Nutri. Me conte o que você comeu, por texto ou voz, que eu calculo e registro. Também respondo dúvidas e sugiro refeições para bater suas metas.</p>
              </div>
              <p className="label mb-2 mt-4">Experimente</p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-2xl bg-white px-4 py-3 text-left text-[14px] font-medium active:scale-[0.99] dark:bg-white/5">{s}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex animate-fade-in ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={m.role === 'user' ? 'max-w-[85%] rounded-3xl rounded-br-lg bg-violet-600 px-4 py-2.5 text-white' : 'w-full'}>
                {m.role === 'user' ? <p className="whitespace-pre-wrap text-[14.5px]">{m.content}</p> : (
                  <div className="space-y-2">
                    <div className={`mr-8 rounded-3xl rounded-bl-lg px-4 py-2.5 ${m.error ? 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300' : 'bg-white dark:bg-white/5'}`}>
                      <p className="whitespace-pre-wrap text-[14.5px]">{m.content}</p>
                    </div>
                    {m.foods?.length > 0 && (
                      <div className="rounded-3xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-400/20 dark:bg-violet-400/5">
                        {m.added ? (
                          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><Check size={16} /> Adicionado ao diário</p>
                        ) : (
                          <>
                            <FoodReview foods={m.foods} setFoods={(f) => updateMsg(i, { foods: f })} />
                            <div className="mt-2 flex gap-2">
                              <div className="w-[48%]"><MealSelect id={`chat-meal-${i}`} value={m.meal} onChange={(v) => updateMsg(i, { meal: v })} /></div>
                              <button className="btn-primary flex-1 !px-2" onClick={() => { addFoods(m.meal, stripBase(m.foods), 'Registrado pela Nutri IA'); updateMsg(i, { added: true }) }}>
                                <Plus size={16} /> {fmt(sumNutrients(m.foods).kcal)} kcal
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-sm muted"><Loader2 size={16} className="animate-spin" /> Nutri está pensando…</div>}
          <div ref={end} />
        </div>
      )}
    </Sheet>
  )
}

// ------------------------------------------------------------------ Provider + botão "+"
export function AddFlowProvider({ children }) {
  const { day } = useApp()
  const [flow, setFlow] = useState(null) // {mode, mealId}
  const open = useCallback((mode, mealId) => setFlow({ mode, mealId: mealId || guessMeal(day.meals) }), [day.meals])
  const close = useCallback(() => setFlow(null), [])
  const meal = flow && day.meals.find((m) => m.id === flow.mealId)
  return (
    <FlowCtx.Provider value={{ open }}>
      {children}
      <PlateSheet open={flow?.mode === 'plate'} onClose={close} mealId={flow?.mealId} />
      <BarcodeSheet open={flow?.mode === 'barcode'} onClose={close} mealId={flow?.mealId} />
      <ChatSheet open={flow?.mode === 'chat'} onClose={close} mealId={flow?.mealId} />
      <FoodSheet open={flow?.mode === 'search' && !!meal} meal={meal} onClose={close} />
    </FlowCtx.Provider>
  )
}

export function QuickAddButton() {
  const { open } = useAddFlow()
  const [menu, setMenu] = useState(false)
  const items = [
    ['plate', Camera, 'Foto do prato', 'A IA reconhece o que tem no prato', 'from-emerald-500 to-teal-600'],
    ['chat', Sparkles, 'Falar com a Nutri IA', 'Conte o que comeu, por texto ou voz', 'from-violet-500 to-fuchsia-600'],
    ['barcode', ScanBarcode, 'Código de barras', 'Escaneie produtos embalados', 'from-sky-500 to-blue-600'],
    ['search', Search, 'Buscar alimento', 'Mais de 70 alimentos brasileiros', 'from-amber-400 to-orange-500'],
  ]
  return (
    <>
      <button onClick={() => setMenu(true)} aria-label="Registrar alimento"
        className="fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/40 transition active:scale-90 dark:bg-emerald-500 dark:text-emerald-950"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)', right: 'max(18px, calc(50vw - 222px), env(safe-area-inset-right, 0px))' }}>
        <Plus size={28} strokeWidth={2.6} />
      </button>
      <Sheet open={menu} onClose={() => setMenu(false)} title="Registrar">
        <div className="space-y-2">
          {items.map(([m, I, l, d, g]) => (
            <button key={m} onClick={() => { setMenu(false); open(m) }} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left active:scale-[0.99] dark:bg-white/5">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${g} text-white`}><I size={22} /></span>
              <span><b className="block text-[15px]">{l}</b><span className="text-xs muted">{d}</span></span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
