import { t, locale } from '../i18n'
// Cálculos nutricionais — fórmulas de referência usadas em nutrição esportiva.

export const SEX = { M: 'Masculino', F: 'Feminino' }

export const ACTIVITY_LEVELS = [
  { id: 'sedentario', get label() { return t('Sedentário') }, get desc() { return t('Pouco ou nenhum exercício') }, factor: 1.2 },
  { id: 'leve', get label() { return t('Levemente ativo') }, get desc() { return t('Exercício 1–3x por semana') }, factor: 1.375 },
  { id: 'moderado', get label() { return t('Moderadamente ativo') }, get desc() { return t('Exercício 3–5x por semana') }, factor: 1.55 },
  { id: 'intenso', get label() { return t('Muito ativo') }, get desc() { return t('Exercício 6–7x por semana') }, factor: 1.725 },
  { id: 'atleta', get label() { return t('Extremamente ativo') }, get desc() { return t('Treino 2x/dia ou trabalho físico') }, factor: 1.9 },
]

// Cada objetivo define ajuste calórico (% sobre o gasto total), proteína (g/kg) e % de gordura.
export const GOALS = [
  { id: 'massa', get label() { return t('Ganhar massa muscular') }, get short() { return t('Hipertrofia') }, adjust: 0.12, proteinPerKg: 2.0, fatPct: 0.25, color: 'from-violet-500 to-fuchsia-500',
    get tip() { return t('Superávit leve de ~12% com proteína alta e treino de força progressivo.') } },
  { id: 'emagrecer', get label() { return t('Emagrecimento / Definição') }, get short() { return t('Definição') }, adjust: -0.2, proteinPerKg: 2.2, fatPct: 0.25, color: 'from-orange-500 to-rose-500',
    get tip() { return t('Déficit de ~20% preservando massa magra com proteína elevada.') } },
  { id: 'manter', get label() { return t('Manter peso') }, get short() { return t('Manutenção') }, adjust: 0, proteinPerKg: 1.6, fatPct: 0.3, color: 'from-sky-500 to-cyan-500',
    get tip() { return t('Calorias iguais ao gasto diário para manter o peso estável.') } },
  { id: 'energia', get label() { return t('Mais energia e disposição') }, get short() { return t('Energia') }, adjust: 0, proteinPerKg: 1.6, fatPct: 0.27, color: 'from-amber-400 to-orange-500',
    get tip() { return t('Manutenção com carboidratos de qualidade distribuídos ao longo do dia.') } },
  { id: 'reeducacao', get label() { return t('Reeducação alimentar') }, get short() { return t('Reeducação') }, adjust: -0.08, proteinPerKg: 1.6, fatPct: 0.28, color: 'from-emerald-500 to-teal-500',
    get tip() { return t('Déficit suave de ~8%, foco em comida de verdade e regularidade.') } },
]

export const goalById = (id) => GOALS.find((g) => g.id === id) || GOALS[2]
export const activityById = (id) => ACTIVITY_LEVELS.find((a) => a.id === id) || ACTIVITY_LEVELS[2]

/** Taxa metabólica basal — Mifflin-St Jeor (1990). */
export function bmr({ sex, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'F' ? base - 161 : base + 5)
}

/** Calcula todas as metas diárias a partir do perfil. Retorna também os passos do cálculo. */
export function calculateGoals(profile) {
  const goal = goalById(profile.goal)
  const act = activityById(profile.activity)
  const tmb = bmr(profile)
  const tdee = Math.round(tmb * act.factor)
  let kcal = Math.round(tdee * (1 + goal.adjust))
  // Piso de segurança: nunca abaixo da TMB nem de 1200 (F) / 1500 (M) kcal.
  const floor = Math.max(tmb, profile.sex === 'F' ? 1200 : 1500)
  const floored = kcal < floor
  if (floored) kcal = floor
  kcal = Math.round(kcal / 10) * 10

  const protein = Math.round(goal.proteinPerKg * profile.weight)
  const fat = Math.round((kcal * goal.fatPct) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  const fiber = Math.round((kcal / 1000) * 14)
  const extraWater = ['intenso', 'atleta'].includes(act.id) ? 500 : act.id === 'moderado' ? 250 : 0
  const water = Math.round((profile.weight * 35 + extraWater) / 50) * 50

  return {
    kcal, protein, carbs, fat, fiber, water,
    meals: profile.mealsPerDay || 5,
    breakdown: { tmb, tdee, factor: act.factor, adjust: goal.adjust, floored, floor },
  }
}

export function bmi(weight, heightCm) {
  const h = heightCm / 100
  const v = weight / (h * h)
  let label = 'Peso normal'
  if (v < 18.5) label = 'Abaixo do peso'
  else if (v >= 30) label = 'Obesidade'
  else if (v >= 25) label = 'Sobrepeso'
  return { value: Math.round(v * 10) / 10, label: t(label) }
}

// ---------- Atividades físicas (Compendium of Physical Activities — METs) ----------
export const ACTIVITIES = [
  { id: 'musculacao', get label() { return t('Musculação') }, icon: 'Dumbbell', met: { leve: 3.5, moderada: 5.0, intensa: 6.0 } },
  { id: 'corrida', get label() { return t('Corrida') }, icon: 'Footprints', met: { leve: 7.0, moderada: 9.8, intensa: 11.5 } },
  { id: 'caminhada', get label() { return t('Caminhada') }, icon: 'PersonStanding', met: { leve: 2.8, moderada: 3.5, intensa: 5.0 } },
  { id: 'ciclismo', get label() { return t('Ciclismo') }, icon: 'Bike', met: { leve: 4.0, moderada: 6.8, intensa: 10.0 } },
  { id: 'natacao', get label() { return t('Natação') }, icon: 'Waves', met: { leve: 5.8, moderada: 7.0, intensa: 9.8 } },
  { id: 'funcional', get label() { return t('Funcional / HIIT') }, icon: 'Flame', met: { leve: 4.0, moderada: 6.0, intensa: 8.0 } },
  { id: 'futebol', get label() { return t('Futebol') }, icon: 'Trophy', met: { leve: 5.0, moderada: 7.0, intensa: 10.0 } },
  { id: 'esportes', get label() { return t('Outros esportes') }, icon: 'Volleyball', met: { leve: 4.0, moderada: 6.0, intensa: 8.0 } },
  { id: 'yoga', get label() { return t('Yoga / Pilates') }, icon: 'Flower2', met: { leve: 2.5, moderada: 3.0, intensa: 4.0 } },
  { id: 'danca', get label() { return t('Dança') }, icon: 'Music', met: { leve: 3.5, moderada: 5.0, intensa: 7.3 } },
]
export const INTENSITIES = [
  { id: 'leve', get label() { return t('Leve') } },
  { id: 'moderada', get label() { return t('Moderada') } },
  { id: 'intensa', get label() { return t('Intensa') } },
]

/** kcal = MET × peso (kg) × horas */
export function activityKcal(activityId, intensity, minutes, weight) {
  const a = ACTIVITIES.find((x) => x.id === activityId)
  const met = a ? a.met[intensity] : 5
  return Math.round(met * weight * (minutes / 60))
}

// ---------- Alimentos ----------
const r1 = (n) => Math.round(n * 10) / 10

/** Nutrientes de uma quantidade (em gramas) de um alimento com base em 100 g. */
export function nutrientsFor(per100, grams) {
  const k = grams / 100
  return {
    kcal: Math.round(per100.kcal * k),
    protein: r1(per100.protein * k),
    carbs: r1(per100.carbs * k),
    fat: r1(per100.fat * k),
    fiber: r1(per100.fiber * k),
  }
}

export const EMPTY = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

export function sumNutrients(items) {
  const t = items.reduce((acc, it) => ({
    kcal: acc.kcal + (it.kcal || 0),
    protein: acc.protein + (it.protein || 0),
    carbs: acc.carbs + (it.carbs || 0),
    fat: acc.fat + (it.fat || 0),
    fiber: acc.fiber + (it.fiber || 0),
  }), { ...EMPTY })
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat), fiber: r1(t.fiber) }
}

export const fmt = (n, d = 0) => Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: 0 })
