import { FOODS } from './foods'
import { nutrientsFor, sumNutrients } from '../lib/nutrition'

// Refeições padrão do diário
export const DEFAULT_MEALS = [
  { id: 'cafe', name: 'Café da manhã', time: '07:00' },
  { id: 'lanche-manha', name: 'Lanche da manhã', time: '10:00' },
  { id: 'almoco', name: 'Almoço', time: '12:30' },
  { id: 'lanche-tarde', name: 'Lanche da tarde', time: '16:00' },
  { id: 'jantar', name: 'Jantar', time: '19:30' },
  { id: 'ceia', name: 'Ceia', time: '22:00' },
]

// Cardápios prontos: cada item é [idDoAlimento, gramas]
const PLANS_RAW = [
  {
    id: 'hipertrofia', name: 'Hipertrofia', goal: 'massa', subtitle: 'Superávit com proteína alta em 6 refeições',
    meals: {
      'cafe': [['pao-frances', 100], ['ovo', 150], ['queijo-minas', 30], ['banana', 70], ['leite-desnatado', 200]],
      'lanche-manha': [['iogurte-grego', 100], ['granola', 36], ['mel', 10]],
      'almoco': [['arroz-branco', 225], ['feijao-carioca', 172], ['frango-peito', 180], ['salada-mista', 120], ['azeite', 10]],
      'lanche-tarde': [['whey', 30], ['aveia', 45], ['banana', 140], ['pasta-amendoim', 15]],
      'jantar': [['macarrao', 220], ['patinho', 150], ['brocolis', 90]],
      'ceia': [['leite-integral', 200], ['castanha-para', 12]],
    },
  },
  {
    id: 'energia', name: 'Mais energia no dia a dia', goal: 'energia', subtitle: 'Carboidratos de qualidade e refeições regulares',
    meals: {
      'cafe': [['aveia', 45], ['iogurte-natural', 170], ['mamao', 150], ['banana', 70], ['chia', 12], ['cafe', 100]],
      'lanche-manha': [['banana', 70], ['castanha-caju', 20]],
      'almoco': [['arroz-integral', 180], ['feijao-preto', 129], ['tilapia', 140], ['salada-mista', 120], ['cenoura', 45], ['azeite', 6]],
      'lanche-tarde': [['pao-integral', 75], ['peito-peru', 45], ['queijo-cottage', 30], ['maca', 130]],
      'jantar': [['batata-doce', 200], ['frango-peito', 120], ['abobrinha', 90], ['azeite', 10]],
      'ceia': [['iogurte-grego', 100], ['morango', 60], ['granola', 24]],
    },
  },
  {
    id: 'definicao', name: 'Secar / Definição', goal: 'emagrecer', subtitle: 'Déficit calórico com proteína em todas as refeições',
    meals: {
      'cafe': [['ovo', 100], ['clara', 66], ['pao-integral', 25], ['cafe', 100], ['mamao', 150]],
      'lanche-manha': [['iogurte-grego', 100], ['morango', 60]],
      'almoco': [['arroz-integral', 90], ['feijao-carioca', 86], ['frango-peito', 150], ['salada-mista', 240], ['azeite', 5]],
      'lanche-tarde': [['whey', 30], ['maca', 130], ['amendoas', 10]],
      'jantar': [['tilapia', 150], ['brocolis', 180], ['batata-doce', 80], ['azeite', 5]],
      'ceia': [['queijo-cottage', 60], ['chia', 6]],
    },
  },
]

const byId = Object.fromEntries(FOODS.map((f) => [f.id, f]))

export function buildPlanItems(items, scale = 1) {
  return items.map(([foodId, grams]) => {
    const f = byId[foodId]
    const g = Math.max(5, Math.round((grams * scale) / 5) * 5)
    return { foodId, name: f.name, grams: g, ...nutrientsFor(f.per100, g) }
  })
}

export const MEAL_PLANS = PLANS_RAW.map((p) => {
  const meals = DEFAULT_MEALS.map((m) => ({ ...m, items: buildPlanItems(p.meals[m.id] || []) }))
  const total = sumNutrients(meals.flatMap((m) => m.items))
  return { ...p, mealsBuilt: meals, total }
})
