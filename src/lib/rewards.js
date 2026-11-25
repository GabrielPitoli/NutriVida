import { t } from '../i18n'
// Sistema de recompensas: missões diárias → XP → níveis, sequência de dias (ofensiva) e medalhas.
// Tudo é DERIVADO dos registros dos dias, então fica igual em todos os aparelhos e não pode "dessincronizar".
import { sumNutrients } from './nutrition'
import { addDays, todayKey } from './dates'

export const MISSIONS = [
  { id: 'agua', get label() { return t('Bater a meta de água') }, xp: 20, color: '#0ea5e9' },
  { id: 'proteina', get label() { return t('Atingir 90% da proteína') }, xp: 20, color: '#f43f5e' },
  { id: 'calorias', get label() { return t('Ficar entre 90% e 110% das calorias') }, xp: 25, color: '#10b981' },
  { id: 'refeicoes', get label() { return t('Registrar todas as refeições') }, xp: 15, color: '#f59e0b' },
  { id: 'movimento', get label() { return t('Fazer uma atividade física') }, xp: 20, color: '#f97316' },
]
export const PERFECT_BONUS = 50
export const DAY_TARGET = 3 // missões para "garantir" o dia e manter a ofensiva

export const LEVELS = ['Iniciante', 'Aprendiz', 'Focado', 'Constante', 'Disciplinado', 'Atleta', 'Expert', 'Mestre', 'Lenda', 'Ícone']
// XP acumulado para alcançar cada nível: 0, 100, 250, 450, 700...
export const levelThreshold = (n) => (n <= 1 ? 0 : 25 * (n - 1) * (n + 2))
export function levelInfo(xp) {
  let n = 1
  while (xp >= levelThreshold(n + 1)) n++
  const cur = levelThreshold(n), next = levelThreshold(n + 1)
  return { level: n, title: t(LEVELS[Math.min(n - 1, LEVELS.length - 1)]), xpInLevel: xp - cur, xpForNext: next - cur, pct: (xp - cur) / (next - cur) }
}

/** Avalia um dia: quais missões foram cumpridas, progresso de cada uma e XP. */
export function evaluateDay(day, goals) {
  const items = day.meals.flatMap((m) => m.items)
  const n = sumNutrients(items)
  const water = day.water.reduce((a, x) => a + x.ml, 0)
  const burned = day.activities.reduce((a, x) => a + (x.kcal || 0), 0)
  const mealsDone = day.meals.filter((m) => m.items.length).length
  const kcalTarget = goals.kcal + burned
  const progress = {
    agua: water / goals.water,
    proteina: n.protein / (goals.protein * 0.9),
    calorias: n.kcal / (kcalTarget * 0.9),
    refeicoes: mealsDone / goals.meals,
    movimento: day.activities.length ? 1 : 0,
  }
  const done = {
    agua: water >= goals.water,
    proteina: n.protein >= goals.protein * 0.9,
    calorias: n.kcal >= kcalTarget * 0.9 && n.kcal <= kcalTarget * 1.1,
    refeicoes: mealsDone >= goals.meals,
    movimento: day.activities.length > 0,
  }
  const count = Object.values(done).filter(Boolean).length
  const perfect = count === MISSIONS.length
  const logXp = Math.min(20, (items.length + day.water.length + day.activities.length) * 2) // XP por registrar
  const xp = MISSIONS.reduce((s, m) => s + (done[m.id] ? m.xp : 0), 0) + (perfect ? PERFECT_BONUS : 0) + logXp
  return { done, progress, count, perfect, xp, logXp, secured: count >= DAY_TARGET, items: items.length, water, burned, recipes: items.filter((i) => i.recipeId).length }
}

/** Consolida todos os dias: XP total, ofensiva atual/recorde, medalhas. `days` = { 'AAAA-MM-DD': day } */
export function summarize(days, goals, extra = {}) {
  const keys = Object.keys(days).sort()
  const evals = Object.fromEntries(keys.map((k) => [k, evaluateDay(days[k], goals)]))
  const xp = keys.reduce((s, k) => s + evals[k].xp, 0)

  // Ofensiva: dias seguidos garantidos. Se hoje ainda não foi garantido, conta a partir de ontem ("em risco").
  const today = todayKey()
  let cursor = evals[today]?.secured ? today : addDays(today, -1)
  let streak = 0
  while (evals[cursor]?.secured) { streak++; cursor = addDays(cursor, -1) }
  const todaySecured = !!evals[today]?.secured

  let best = 0, run = 0, prev = null
  for (const k of keys) {
    if (evals[k].secured) { run = prev && addDays(prev, 1) === k ? run + 1 : 1; prev = k; best = Math.max(best, run) }
  }
  best = Math.max(best, streak)

  const count = (fn) => keys.filter((k) => fn(evals[k])).length
  const stats = {
    logged: count((e) => e.items > 0),
    water: count((e) => e.done.agua),
    protein: count((e) => e.done.proteina),
    kcal: count((e) => e.done.calorias),
    active: count((e) => e.done.movimento),
    perfect: count((e) => e.perfect),
    recipes: keys.reduce((s, k) => s + evals[k].recipes, 0),
  }
  const lv = levelInfo(xp)
  const badges = BADGES.map((b) => {
    b = { ...b, title: b.title, desc: b.desc }
    const value = b.value({ ...stats, best, streak, xp, level: lv.level, ...extra })
    return { ...b, value: Math.min(value, b.goal), unlocked: value >= b.goal }
  })
  return { xp, ...lv, streak, best, todaySecured, today: evals[today] || evaluateDay({ meals: [], water: [], activities: [] }, goals), evals, stats, badges }
}

export const BADGES = [
  { id: 'primeiro', get title() { return t('Primeiro passo') }, get desc() { return t('Registre seu primeiro dia') }, icon: 'Sprout', goal: 1, value: (s) => s.logged },
  { id: 'ofensiva3', get title() { return t('Esquentando') }, get desc() { return t('Ofensiva de 3 dias') }, icon: 'Flame', goal: 3, value: (s) => s.best },
  { id: 'ofensiva7', get title() { return t('Semana de fogo') }, get desc() { return t('Ofensiva de 7 dias') }, icon: 'Flame', goal: 7, value: (s) => s.best },
  { id: 'ofensiva30', get title() { return t('Imparável') }, get desc() { return t('Ofensiva de 30 dias') }, icon: 'Crown', goal: 30, value: (s) => s.best },
  { id: 'agua7', get title() { return t('Fonte de vida') }, get desc() { return t('Bata a meta de água em 7 dias') }, icon: 'Droplets', goal: 7, value: (s) => s.water },
  { id: 'proteina10', get title() { return t('Construtor') }, get desc() { return t('Bata a proteína em 10 dias') }, icon: 'Beef', goal: 10, value: (s) => s.protein },
  { id: 'calorias10', get title() { return t('Na mosca') }, get desc() { return t('Calorias no alvo em 10 dias') }, icon: 'Target', goal: 10, value: (s) => s.kcal },
  { id: 'treino5', get title() { return t('Em movimento') }, get desc() { return t('Treine em 5 dias') }, icon: 'Dumbbell', goal: 5, value: (s) => s.active },
  { id: 'perfeito', get title() { return t('Dia perfeito') }, get desc() { return t('Cumpra as 5 missões no mesmo dia') }, icon: 'Star', goal: 1, value: (s) => s.perfect },
  { id: 'chef', get title() { return t('Chef saudável') }, get desc() { return t('Registre 5 receitas') }, icon: 'ChefHat', goal: 5, value: (s) => s.recipes },
  { id: 'criador', get title() { return t('Criador') }, get desc() { return t('Crie sua primeira receita') }, icon: 'Lightbulb', goal: 1, value: (s) => s.myRecipes || 0 },
  { id: 'nivel5', get title() { return t('Disciplina') }, get desc() { return t('Alcance o nível 5') }, icon: 'Medal', goal: 5, value: (s) => s.level },
]
