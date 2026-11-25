import { t } from '../i18n'
/**
 * Qualidade nutricional (1 = péssimo … 5 = excelente).
 * Ordem de prioridade: nota definida à mão (base de alimentos) → Nutri-Score do produto (Open Food Facts)
 * → nota da IA → cálculo por densidade de nutrientes.
 * O cálculo segue a lógica do Nutri-Score/NRF: soma pontos por proteína, fibras e baixa densidade calórica
 * e tira pontos por açúcar, gordura saturada, sódio e excesso de calorias.
 */
export const GRADES = {
  5: { get label() { return t('Excelente') }, color: '#16a34a', soft: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' },
  4: { get label() { return t('Bom') }, color: '#65a30d', soft: 'bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300' },
  3: { get label() { return t('Normal') }, color: '#eab308', soft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300' },
  2: { get label() { return t('Ruim') }, color: '#f97316', soft: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300' },
  1: { get label() { return t('Péssimo') }, color: '#dc2626', soft: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' },
}
const NUTRISCORE = { a: 5, b: 4, c: 3, d: 2, e: 1 }

/**
 * Calcula nota e motivos. `n` = nutrientes (por 100 g se `per100`, senão da porção).
 * `extra` = { sugar, satfat, sodiumMg } por 100 g quando conhecidos.
 */
export function computeGrade(n, { per100 = false, extra = null } = {}) {
  const kcal = Math.max(n.kcal || 0, 1)
  const reasons = []
  let s = 0
  const pPer100kcal = (n.protein || 0) / kcal * 100
  const fPer100kcal = (n.fiber || 0) / kcal * 100
  if (pPer100kcal >= 8) { s += 2; reasons.push(['+', 'Rico em proteína']) } else if (pPer100kcal >= 4) { s += 1; reasons.push(['+', 'Fonte de proteína']) }
  if (fPer100kcal >= 2.5) { s += 2; reasons.push(['+', 'Rico em fibras']) } else if (fPer100kcal >= 1) { s += 1; reasons.push(['+', 'Tem fibras']) }
  if (per100) {
    if (kcal <= 60) { s += 2; reasons.push(['+', 'Poucas calorias']) } else if (kcal <= 150) s += 1
    else if (kcal >= 450) { s -= 2; reasons.push(['-', 'Muito calórico']) } else if (kcal >= 300) { s -= 1; reasons.push(['-', 'Calórico']) }
  }
  if (extra) {
    if (per100 && extra.sugar >= 5 && kcal <= 80 && (n.protein || 0) < 1.5 && (n.fiber || 0) < 1) { s -= 4; reasons.push(['-', 'Bebida açucarada']) }
    else if (extra.sugar >= 22.5) { s -= 3; reasons.push(['-', 'Muito açúcar']) } else if (extra.sugar >= 10) { s -= 1; reasons.push(['-', 'Açúcar moderado']) }
    if (extra.satfat >= 10) { s -= 2; reasons.push(['-', 'Muita gordura saturada']) } else if (extra.satfat >= 5) { s -= 1; reasons.push(['-', 'Gordura saturada']) }
    if (extra.sodiumMg >= 600) { s -= 2; reasons.push(['-', 'Muito sódio']) } else if (extra.sodiumMg >= 300) { s -= 1; reasons.push(['-', 'Sódio moderado']) }
  }
  const fatShare = (n.fat || 0) * 9 / kcal
  if (fatShare > 0.6 && fPer100kcal < 1 && pPer100kcal < 8) { s -= 1; reasons.push(['-', 'Muita gordura']) }
  const carbShare = (n.carbs || 0) * 4 / kcal
  if (carbShare > 0.8 && fPer100kcal < 1 && pPer100kcal < 4) { s -= 1; reasons.push(['-', 'Carboidrato simples, pouca fibra']) }
  const grade = s >= 4 ? 5 : s >= 2 ? 4 : s >= 0 ? 3 : s >= -2 ? 2 : 1
  return { grade, reasons }
}

/** Nota de um alimento da base / produto / personalizado. */
export function gradeFood(food) {
  if (food.q) return { grade: food.q, reasons: food.qReasons || [] }
  if (food.nutriscore && NUTRISCORE[food.nutriscore]) {
    // Nutri-Score como base, limitado pelo nosso cálculo (alguns cadastros têm nota otimista)
    const c = computeGrade(food.per100, { per100: true, extra: food.extra })
    return { grade: Math.min(NUTRISCORE[food.nutriscore], c.grade + 1), reasons: [['i', `Nutri-Score ${food.nutriscore.toUpperCase()}`], ...c.reasons] }
  }
  return computeGrade(food.per100, { per100: true, extra: food.extra })
}

/** Nota de um item registrado no diário (já tem kcal/macros da porção). */
export function gradeItem(it, foodsById) {
  if (it.q) return it.q
  const f = it.foodId && foodsById?.[it.foodId]
  if (f) return gradeFood(f).grade
  return computeGrade(it).grade
}

/** Média ponderada pelas calorias (itens sem calorias, como café, pesam pouco). */
export function gradeOfItems(items, foodsById) {
  if (!items.length) return null
  let w = 0, s = 0
  for (const it of items) { const k = Math.max(it.kcal || 0, 15); w += k; s += k * gradeItem(it, foodsById) }
  return Math.round(s / w * 10) / 10
}

/** Distribuição de calorias por nota, para a barra do dashboard. */
export function distribution(items, foodsById) {
  const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const it of items) d[gradeItem(it, foodsById)] += Math.max(it.kcal || 0, 0)
  return d
}
