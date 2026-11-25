import { t, isEn } from '../i18n'
/**
 * IA integrada (Claude) — disponível quando o app roda no claude.ai (capacidade `sample`).
 * Cada chamada é independente: enviamos instruções + dados + formato de resposta.
 * Fora do claude.ai `getAI()` resolve null e a interface mostra o recurso como indisponível.
 */
import { getApiKey, createKeySample } from './aiKey'

let aiPromise = null
/**
 * Resolve de onde vem a IA:
 *  1. claude.ai (capacidade `sample`, usa a conta Claude de quem está usando);
 *  2. chave de API própria guardada no aparelho (versão hospedada, ex.: GitHub Pages);
 *  3. nenhuma → null (a interface mostra como ativar).
 */
export function getAI() {
  if (!aiPromise) {
    aiPromise = (async () => {
      const claude = window.claude
      if (claude?.use) {
        const sample = await claude.use('sample').catch(() => null)
        if (sample) {
          const limits = await sample.limits().catch(() => null)
          return { sample, images: !!limits?.images, provider: 'claude' }
        }
      }
      const key = getApiKey()
      if (key) return { sample: createKeySample(key), images: true, provider: 'apikey' }
      return null
    })()
  }
  return aiPromise
}
/** Chamar depois de salvar/remover a chave. */
export function resetAI() { aiPromise = null; window.dispatchEvent(new Event('nutrivida-ai-changed')) }

let dictPromise = null
export function getDictation() {
  if (!dictPromise) dictPromise = window.claude?.use ? window.claude.use('dictation').catch(() => null) : Promise.resolve(null)
  return dictPromise
}

export function aiErrorText(e) {
  switch (e?.code) {
    case 'not_granted': return t('Você não permitiu o uso da IA neste app. Dá para liberar no menu de permissões do app.')
    case 'rate_limited': return t('Muitos pedidos seguidos. Espere um minuto e tente de novo.')
    case 'cancelled': return t('Pedido cancelado.')
    case 'invalid_json': return t('A IA respondeu num formato inesperado. Tente de novo ou descreva de outro jeito.')
    case 'image_rejected': return t('Não consegui ler essa imagem. Tente outra foto (JPG ou PNG).')
    case 'images_unavailable': return t('Envio de fotos para a IA não está disponível aqui.')
    case 'sampling_disabled': return t('A IA está desativada para a sua conta.')
    case 'bad_key': return t('Chave de API inválida ou sem permissão. Confira em Metas → Inteligência artificial.')
    case 'bad_request': return t('A API recusou o pedido. Verifique se sua conta da API tem créditos (console.anthropic.com → Billing).')
    case 'refused': return t('A IA não pôde responder a esse pedido. Tente descrever de outro jeito.')
    case 'network': return t('Sem conexão com a IA. Verifique sua internet.')
    default: return t('A IA não respondeu agora. Verifique a conexão e tente de novo.')
  }
}

// O idioma das respostas da IA acompanha o idioma do app
const LANG_RULE = () => (isEn() ? '\nIMPORTANTE: escreva todos os nomes, descrições e textos em INGLÊS (English).' : '\nEscreva nomes e textos em português do Brasil.')

const FOOD_SHAPE = `{"name": string (nome no idioma pedido), "grams": number, "portion": string (ex.: "2 unidades"), "kcal": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "quality": 1-5 (qualidade nutricional: 5 excelente, 4 bom, 3 normal, 2 ruim, 1 péssimo; considere processamento, açúcar, sódio, gordura saturada, fibras e proteína)}`

const num = (v) => (Number.isFinite(+v) ? Math.max(0, Math.round(+v * 10) / 10) : 0)
export function cleanFoods(list) {
  if (!Array.isArray(list)) return []
  return list.filter((f) => f && f.name).slice(0, 15).map((f) => ({
    name: String(f.name).slice(0, 80), grams: num(f.grams), portion: f.portion ? String(f.portion).slice(0, 40) : null,
    kcal: Math.round(num(f.kcal)), protein: num(f.protein), carbs: num(f.carbs), fat: num(f.fat), fiber: num(f.fiber), ai: true,
    ...([1, 2, 3, 4, 5].includes(Math.round(+f.quality)) ? { q: Math.round(+f.quality) } : {}),
  }))
}

/** Foto do prato → lista de alimentos com porções estimadas (inspirado em apps como o Foodvisor). */
export async function analyzePlate(file, hint, signal) {
  const ai = await getAI()
  const res = await ai.sample.json(
    `Você é um nutricionista brasileiro. A imagem é uma foto de uma refeição.
Identifique cada alimento visível e estime a porção em gramas pelo tamanho no prato (use talheres e o prato como referência).
Use valores nutricionais da tabela TACO/USDA para a porção estimada.${hint ? `\nObservação da pessoa: ${hint}` : ''}
Responda APENAS com JSON: {"description": string curta, "foods": [${FOOD_SHAPE}], "confidence": "alta"|"média"|"baixa"}
Se a imagem não for comida, responda {"description": "não parece uma refeição", "foods": []}.${LANG_RULE()}`,
    { images: [file], signal, modelTier: 'default', cache: false },
  )
  return { description: res?.description || '', confidence: res?.confidence || '', foods: cleanFoods(res?.foods) }
}

/** Foto do rótulo / tabela nutricional → alimento por 100 g. */
export async function readLabel(file, signal) {
  const ai = await getAI()
  const r = await ai.sample.json(
    `A imagem é a embalagem ou a tabela nutricional de um produto alimentício brasileiro.
Leia o nome do produto e os valores da tabela. Converta para 100 g (ou 100 ml) e informe a porção indicada no rótulo.
${LANG_RULE()}
Responda APENAS com JSON: {"name": string, "brand": string|null, "portionGrams": number|null, "per100": {"kcal": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number|null, "satfat": number|null, "sodiumMg": number|null}}`,
    { images: [file], signal, cache: false },
  )
  const p = r?.per100 || {}
  return { name: String(r?.name || 'Produto').slice(0, 80), brand: r?.brand || null, portionGrams: num(r?.portionGrams) || null,
    per100: { kcal: num(p.kcal), protein: num(p.protein), carbs: num(p.carbs), fat: num(p.fat), fiber: num(p.fiber) },
    extra: { sugar: num(p.sugar), satfat: num(p.satfat), sodiumMg: num(p.sodiumMg) } }
}

/** Chat com a nutricionista IA. `turns` = [{role, content}] mantidos pela página. */
export async function chat(turns, ctx, { signal, onText } = {}) {
  const ai = await getAI()
  const rules = `Você é a "Nutri", assistente de nutrição do app NutriVida. Fale de forma curta, calorosa e prática.
Dados da pessoa: ${ctx.profile}
Metas diárias: ${ctx.goals}
Hoje até agora: ${ctx.today}
Refeições do diário (use o id em "meal"): ${ctx.meals}
Hora atual: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

Quando a pessoa contar o que comeu ou pedir para registrar algo, liste os alimentos em "foods" com porções e valores (tabela TACO/USDA) e escolha a refeição mais provável em "meal".
Quando for só uma pergunta ou pedido de dica, deixe "foods" vazio. Nunca invente que já registrou: a pessoa confirma no app.
${isEn() ? 'Responda em INGLÊS (English), mesmo que a pessoa escreva em português.' : 'Responda em português do Brasil.'}
Responda SEMPRE e APENAS com JSON: {"reply": string (até 90 palavras), "meal": string|null, "foods": [${FOOD_SHAPE}]}`
  const res = await ai.sample.json([{ role: 'user', content: rules }, ...turns], { signal, onText, cache: false, modelTier: 'default' })
  return { reply: String(res?.reply || '').slice(0, 1200), meal: res?.meal || null, foods: cleanFoods(res?.foods) }
}

/** Transforma uma ideia livre ("bolo de caneca de banana sem açúcar") numa receita completa. */
export async function recipeFromIdea(idea, signal) {
  const ai = await getAI()
  const r = await ai.sample.json(
    `Crie uma receita saudável a partir desta ideia de uma pessoa: "${idea}".
Use ingredientes comuns no Brasil, medidas caseiras e gramas. Calcule a tabela nutricional POR PORÇÃO (TACO/USDA).${LANG_RULE()}
Responda APENAS com JSON: {"name": string, "category": "cafe"|"almoco"|"lanche"|"jantar"|"treino", "tags": array de "alta-proteina"|"baixa-caloria"|"energia"|"vegetariana",
"time": number (minutos), "servings": number, "ingredients": [string], "steps": [string],
"nutrition": {"kcal": number, "protein": number, "carbs": number, "fat": number, "fiber": number}}`,
    { signal, cache: false },
  )
  const n = r?.nutrition || {}
  return {
    name: String(r?.name || idea).slice(0, 80), category: ['cafe', 'almoco', 'lanche', 'jantar', 'treino'].includes(r?.category) ? r.category : 'lanche',
    tags: Array.isArray(r?.tags) ? r.tags.filter((t) => ['alta-proteina', 'baixa-caloria', 'energia', 'vegetariana'].includes(t)) : [],
    time: Math.round(num(r?.time)) || 15, servings: Math.max(1, Math.round(num(r?.servings)) || 1),
    ingredients: (r?.ingredients || []).map(String).slice(0, 25), steps: (r?.steps || []).map(String).slice(0, 20),
    nutrition: { kcal: Math.round(num(n.kcal)), protein: num(n.protein), carbs: num(n.carbs), fat: num(n.fat), fiber: num(n.fiber) },
  }
}

/** Reduz uma foto para enviar/guardar (webp/jpeg). */
export async function shrinkImage(file, maxW = 1024, type = 'image/jpeg', quality = 0.82) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxW / bmp.width)
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res) => c.toBlob((b) => res(b || file), type, quality))
}

/** Foto de capa para "Minhas receitas": recorte 640×420 em data URL (~30–60 KB). */
export async function coverDataUrl(file) {
  const bmp = await createImageBitmap(file)
  const W = 640, H = 420
  const s = Math.max(W / bmp.width, H / bmp.height)
  const c = document.createElement('canvas'); c.width = W; c.height = H
  c.getContext('2d').drawImage(bmp, (W - bmp.width * s) / 2, (H - bmp.height * s) / 2, bmp.width * s, bmp.height * s)
  let url = c.toDataURL('image/webp', 0.7)
  if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', 0.72)
  return url
}
