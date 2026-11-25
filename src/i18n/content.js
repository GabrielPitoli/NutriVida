// Conteúdo traduzido (alimentos da base e receitas de dica) conforme o idioma atual.
import { isEn } from './index'
import FOODS_EN from './foods.en'
import RECIPES_EN from './recipes.en'
import { FOODS_BY_ID } from '../data/foods'
import { RECIPES } from '../data/recipes'

const RECIPES_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]))

/** Nome do alimento no idioma atual (produtos e alimentos próprios mantêm o nome original). */
export const foodName = (f) => (isEn() && f && FOODS_EN[f.id]) || f?.name || ''

/** Receita de dica com nome, ingredientes e preparo no idioma atual. */
export function localRecipe(r) {
  const en = isEn() && RECIPES_EN[r.id]
  return en ? { ...r, ...en } : r
}

/** Nome de um item registrado no diário (traduz alimentos da base e receitas de dica). */
export function itemName(it) {
  if (!isEn()) return it.name
  if (it.foodId && FOODS_BY_ID[it.foodId]) return FOODS_EN[it.foodId] || it.name
  if (it.recipeId && RECIPES_BY_ID[it.recipeId]) return RECIPES_EN[it.recipeId]?.name || it.name
  return it.name
}
