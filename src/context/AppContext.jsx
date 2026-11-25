import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '../lib/storage'
import { calculateGoals, sumNutrients, activityKcal } from '../lib/nutrition'
import { summarize, evaluateDay, levelInfo, DAY_TARGET } from '../lib/rewards'
import { gradeItem } from '../lib/quality'
import { FOODS_BY_ID } from '../data/foods'
import { DEFAULT_MEALS } from '../data/mealPlans'
import { todayKey, uid } from '../lib/dates'
import { getLang, locale, plural, setLang, t } from '../i18n'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export const DEFAULT_PROFILE = {
  name: '', sex: 'M', age: 30, weight: 75, height: 175,
  activity: 'moderado', goal: 'manter', mealsPerDay: 5,
  manual: null, // { kcal, protein, carbs, fat, water } quando a pessoa ajusta manualmente
  weightLog: [],
  onboarded: false,
}

const newDay = () => ({
  meals: DEFAULT_MEALS.map((m) => ({ ...m, items: [] })),
  water: [], activities: [], celebrated: {},
})

export const calculateGoalsMerged = (profile) => ({ ...calculateGoals(profile), ...(profile.manual || {}), meals: profile.mealsPerDay || 5 })

const strip = (doc) => { if (!doc) return doc; const { _u, ...rest } = doc; return rest }

export function AppProvider({ children }) {
  const [profile, setProfileState] = useState(() => ({ ...DEFAULT_PROFILE, ...strip(storage.get('profile')) }))
  const [settings, setSettingsState] = useState(() => ({ theme: 'system', ...strip(storage.get('settings')) }))
  const [customFoods, setCustomFoods] = useState(() => storage.get('customFoods')?.items || [])
  const [days, setDays] = useState({})
  const loadMyRecipes = () => storage.keysWithPrefix('myrecipe-').map((k) => strip(storage.get(k))).filter((r) => r && !r.deleted)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  const [myRecipes, setMyRecipes] = useState(loadMyRecipes)
  const [dataVersion, setDataVersion] = useState(0)
  const [date, setDate] = useState(todayKey())
  const [syncStatus, setSyncStatus] = useState(storage.status)
  const [celebration, setCelebration] = useState(null)
  const [xpGain, setXpGain] = useState(null)
  const rewardsRef = useRef({ xp: 0, streak: 0, todaySecured: false })
  const [toast, setToast] = useState(null)

  // ---------- sincronização com a nuvem ----------
  useEffect(() => storage.onStatus(setSyncStatus), [])
  useEffect(() => {
    storage.connect((key, doc) => {
      const data = strip(doc)
      if (key === 'profile') setProfileState({ ...DEFAULT_PROFILE, ...data })
      else if (key === 'settings') { if (data.lang) setLang(data.lang); setSettingsState((s) => ({ ...s, ...data })) }
      else if (key === 'customFoods') setCustomFoods(data.items || [])
      else if (key.startsWith('day-')) setDays((d) => ({ ...d, [key.slice(4)]: data }))
      else if (key.startsWith('myrecipe-')) setMyRecipes(loadMyRecipes())
      setDataVersion((n) => n + 1)
    })
  }, [])

  // ---------- tema ----------
  useEffect(() => {
    const root = document.documentElement
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const hostTheme = root.getAttribute('data-theme')
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && (hostTheme ? hostTheme === 'dark' : mq.matches))
      root.classList.toggle('dark', dark)
      root.classList.toggle('light', !dark)
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0b1512' : '#f4f8f6')
    }
    apply()
    mq.addEventListener('change', apply)
    const obs = new MutationObserver(apply)
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { mq.removeEventListener('change', apply); obs.disconnect() }
  }, [settings.theme])

  // ---------- metas ----------
  const calculated = useMemo(() => calculateGoals(profile), [profile])
  const goals = useMemo(() => calculateGoalsMerged(profile), [profile])

  // ---------- dias ----------
  const getDay = useCallback((key) => {
    if (days[key]) return days[key]
    const stored = storage.get('day-' + key)
    return stored ? strip(stored) : newDay()
  }, [days])

  const day = getDay(date)

  // ---------- recompensas (derivadas de todos os dias) ----------
  const allDays = useMemo(() => {
    const out = {}
    for (const k of storage.dayKeys()) { const d = days[k.slice(4)] || strip(storage.get(k)); if (d?.meals) out[k.slice(4)] = d }
    for (const [k, d] of Object.entries(days)) out[k] = d
    return out
  }, [days, dataVersion])
  const rewards = useMemo(() => summarize(allDays, calculateGoalsMerged(profile), { myRecipes: myRecipes.length }), [allDays, profile, myRecipes.length, settings.lang])
  rewardsRef.current = rewards

  const notify = useCallback((msg, tone = 'ok') => {
    setToast({ msg, tone, id: uid() })
  }, [])

  const celebrate = useCallback((c) => setCelebration({ ...c, id: uid() }), [])

  const totalsOf = (d) => {
    const food = sumNutrients(d.meals.flatMap((m) => m.items))
    const burned = d.activities.reduce((a, x) => a + (x.kcal || 0), 0)
    const water = d.water.reduce((a, x) => a + x.ml, 0)
    const mealsDone = d.meals.filter((m) => m.items.length > 0).length
    return { ...food, burned, water, mealsDone }
  }

  const updateDay = useCallback((key, fn) => {
    const prev = getDay(key)
    const next = fn(structuredClone(prev))
    // Detecta metas atingidas para disparar animações (uma vez por dia por meta)
    const a = totalsOf(prev), b = totalsOf(next)
    const c = { ...(next.celebrated || {}) }
    const target = goals
    if (!c.water && a.water < target.water && b.water >= target.water) { c.water = true; celebrate({ kind: 'water', title: t('Meta de água batida!'), sub: t('{n} L hoje. Seu corpo agradece.', { n: (b.water / 1000).toLocaleString(locale()) }) }) }
    else if (!c.protein && a.protein < target.protein && b.protein >= target.protein) { c.protein = true; celebrate({ kind: 'protein', title: t('Proteína do dia completa!'), sub: t('{a} g de {b} g.', { a: Math.round(b.protein), b: target.protein }) }) }
    else if (!c.kcal && a.kcal < target.kcal * 0.95 && b.kcal >= target.kcal * 0.95 && b.kcal <= target.kcal * 1.1) { c.kcal = true; celebrate({ kind: 'kcal', title: t('Meta calórica atingida!'), sub: t('Você chegou no seu alvo de energia do dia.') }) }
    else if (b.mealsDone > a.mealsDone && b.mealsDone >= target.meals && !c.meals) { c.meals = true; celebrate({ kind: 'meals', title: t('{n} refeições feitas!', { n: b.mealsDone }), sub: t('Todas as refeições planejadas do dia.') }) }
    // Recompensas: dia garantido (ofensiva) e subida de nível
    const ea = evaluateDay(prev, target), eb = evaluateDay(next, target)
    if (!c.secured && ea.count < DAY_TARGET && eb.count >= DAY_TARGET) {
      c.secured = true
      celebrate({ kind: 'streak', title: plural(rewardsRef.current.streak + (rewardsRef.current.todaySecured ? 0 : 1), 'Ofensiva de {n} dia!', 'Ofensiva de {n} dias!'), sub: t('{n} missões cumpridas. Seu dia está garantido.', { n: DAY_TARGET }) })
    } else {
      const before = levelInfo(rewardsRef.current.xp).level
      const after = levelInfo(rewardsRef.current.xp - ea.xp + eb.xp).level
      if (after > before) celebrate({ kind: 'level', title: t('Nível {n}!', { n: after }), sub: t('Você agora é {x}.', { x: levelInfo(rewardsRef.current.xp - ea.xp + eb.xp).title }) })
    }
    if (eb.xp > ea.xp) setXpGain({ amount: eb.xp - ea.xp, id: uid() })
    next.celebrated = c
    setDays((d) => ({ ...d, [key]: next }))
    storage.set('day-' + key, next)
    return { prev: a, next: b }
  }, [getDay, goals, celebrate])

  // ---------- ações: alimentação ----------
  const addFoods = useCallback((mealId, items, label) => {
    const res = updateDay(date, (d) => {
      const meal = d.meals.find((m) => m.id === mealId)
      if (!meal) return d
      meal.items.push(...items.map((it) => ({ ...it, q: it.q || gradeItem(it, FOODS_BY_ID), id: uid() })))
      return d
    })
    const meal = day.meals.find((m) => m.id === mealId)
    if (meal && meal.items.length === 0) notify(t('{x} registrado', { x: t(meal.name) }), 'meal')
    else notify(label || t('Alimento adicionado'))
    return res
  }, [date, day, updateDay, notify])

  const removeFood = useCallback((mealId, itemId) => {
    updateDay(date, (d) => { const m = d.meals.find((x) => x.id === mealId); if (m) m.items = m.items.filter((i) => i.id !== itemId); return d })
  }, [date, updateDay])

  const clearMeal = useCallback((mealId) => {
    updateDay(date, (d) => { const m = d.meals.find((x) => x.id === mealId); if (m) m.items = []; return d })
  }, [date, updateDay])

  const addMeal = useCallback((name, time) => {
    updateDay(date, (d) => { d.meals.push({ id: 'custom-' + uid(), name, time: time || '', custom: true, items: [] }); d.meals.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')); return d })
    notify(t('Refeição criada'))
  }, [date, updateDay, notify])

  const removeMeal = useCallback((mealId) => {
    updateDay(date, (d) => { d.meals = d.meals.filter((m) => m.id !== mealId); return d })
  }, [date, updateDay])

  const applyPlan = useCallback((plan, replace) => {
    updateDay(date, (d) => {
      for (const pm of plan) {
        let meal = d.meals.find((m) => m.id === pm.id)
        if (!meal) { meal = { id: pm.id, name: pm.name, time: pm.time, items: [] }; d.meals.push(meal) }
        if (replace) meal.items = []
        meal.items.push(...pm.items.map((it) => ({ ...it, id: uid() })))
      }
      return d
    })
    notify(t('Cardápio aplicado ao dia'), 'meal')
  }, [date, updateDay, notify])

  // ---------- ações: água ----------
  const addWater = useCallback((ml) => {
    if (!ml || ml <= 0) return
    updateDay(date, (d) => { d.water.push({ id: uid(), ml: Math.round(ml), t: Date.now() }); return d })
  }, [date, updateDay])
  const undoWater = useCallback(() => {
    updateDay(date, (d) => { d.water.pop(); return d })
  }, [date, updateDay])

  // ---------- ações: atividades ----------
  const addActivity = useCallback((type, intensity, minutes, manualKcal) => {
    const kcal = manualKcal ?? activityKcal(type, intensity, minutes, profile.weight)
    updateDay(date, (d) => { d.activities.push({ id: uid(), type, intensity, minutes, kcal, t: Date.now() }); return d })
    notify(t('Atividade registrada · {n} kcal', { n: kcal }), 'activity')
  }, [date, updateDay, profile.weight, notify])
  const removeActivity = useCallback((id) => {
    updateDay(date, (d) => { d.activities = d.activities.filter((a) => a.id !== id); return d })
  }, [date, updateDay])

  // ---------- perfil / configurações ----------
  const updateProfile = useCallback((patch) => {
    setProfileState((p) => {
      const next = { ...p, ...patch }
      if (patch.weight && patch.weight !== p.weight) {
        const today = todayKey()
        next.weightLog = [...(p.weightLog || []).filter((w) => w.date !== today), { date: today, kg: patch.weight }].slice(-120)
      }
      storage.set('profile', next)
      return next
    })
  }, [])

  const setLanguage = useCallback((lang) => {
    setLang(lang)
    setSettingsState((s) => { const n = { ...s, lang }; storage.set('settings', n); return n })
  }, [])

  const setTheme = useCallback((theme) => {
    setSettingsState((s) => { const n = { ...s, theme }; storage.set('settings', n); return n })
  }, [])

  const addCustomFood = useCallback((food) => {
    const f = { ...food, id: 'custom-' + uid(), category: 'Meus alimentos', custom: true }
    setCustomFoods((list) => { const n = [f, ...list]; storage.set('customFoods', { items: n }); return n })
    return f
  }, [])

  const saveMyRecipe = useCallback((recipe) => {
    const r = { ...recipe, id: recipe.id || 'mine-' + uid(), mine: true, createdAt: recipe.createdAt || Date.now() }
    storage.set('myrecipe-' + r.id, r)
    setMyRecipes(loadMyRecipes())
    notify(recipe.id ? t('Receita atualizada') : t('Receita salva em Minhas receitas'))
    return r
  }, [notify])
  const deleteMyRecipe = useCallback((id) => {
    storage.remove('myrecipe-' + id)
    setMyRecipes(loadMyRecipes())
    notify(t('Receita excluída'))
  }, [notify])

  const removeCustomFood = useCallback((id) => {
    setCustomFoods((list) => { const n = list.filter((f) => f.id !== id); storage.set('customFoods', { items: n }); return n })
  }, [])

  const resetDay = useCallback(() => {
    const d = newDay()
    setDays((x) => ({ ...x, [date]: d }))
    storage.set('day-' + date, d)
    notify(t('Dia limpo'))
  }, [date, notify])

  const history = useMemo(() => {
    // últimos 7 dias para mini gráfico
    const out = []
    const base = new Date()
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(base); dt.setDate(base.getDate() - i)
      const k = dt.toISOString().slice(0, 10)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      const d = getDay(key)
      out.push({ key, ...totalsOf(d), _k: k })
    }
    return out
  }, [getDay])

  const totals = useMemo(() => totalsOf(day), [day])

  const value = {
    profile, updateProfile, settings, setTheme, setLanguage, lang: settings.lang || getLang(),
    goals, calculated,
    date, setDate, day, totals, history,
    addFoods, removeFood, clearMeal, addMeal, removeMeal, applyPlan,
    addWater, undoWater, addActivity, removeActivity, resetDay,
    customFoods, addCustomFood, removeCustomFood,
    syncStatus, celebration, setCelebration, toast, setToast, notify,
    myRecipes, saveMyRecipe, deleteMyRecipe, rewards, xpGain, setXpGain,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
