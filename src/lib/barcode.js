// Leitura e consulta de código de barras (EAN-13/EAN-8/UPC).
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'

const FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128]
const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, FORMATS], [DecodeHintType.TRY_HARDER, true]])
export const newReader = () => new BrowserMultiFormatReader(hints, 300)

/** Lê o código de uma foto. Tenta o BarcodeDetector nativo (Chrome/Android) e depois o ZXing
 *  em várias escalas e recortes — fotos de celular são grandes e o código costuma ocupar pouco espaço. */
export async function decodeFromFile(file) {
  const bmp = await createImageBitmap(file)
  if ('BarcodeDetector' in window) {
    try {
      const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      const found = await det.detect(bmp)
      if (found[0]?.rawValue) return found[0].rawValue
    } catch { /* cai para o ZXing */ }
  }
  const reader = newReader()
  const tries = [[1, 1600], [1, 1000], [0.6, 1200], [0.4, 1000]] // [fração central da imagem, largura alvo]
  for (const [frac, target] of tries) {
    for (const rot of [0, 90]) {
      const sw = bmp.width * frac, sh = bmp.height * frac
      const sx = (bmp.width - sw) / 2, sy = (bmp.height - sh) / 2
      const scale = Math.min(1, target / Math.max(sw, sh))
      const w = Math.round(sw * scale), h = Math.round(sh * scale)
      const c = document.createElement('canvas')
      c.width = rot ? h : w; c.height = rot ? w : h
      const ctx = c.getContext('2d')
      if (rot) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2) }
      ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h)
      try { return (await reader.decodeFromImageUrl(c.toDataURL('image/jpeg', 0.92))).getText() } catch { /* próxima tentativa */ }
    }
  }
  throw new Error('não encontrado')
}

/** Câmera ao vivo. Retorna função para parar. */
export async function startLiveScan(video, onCode) {
  const reader = newReader()
  await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (res) => { if (res) onCode(res.getText()) })
  return () => reader.reset()
}

export const validEan = (code) => /^\d{8,14}$/.test(code)

/**
 * Consulta o Open Food Facts (base aberta com milhões de produtos, inclusive brasileiros).
 * Funciona quando o app está hospedado num site próprio; dentro do claude.ai a rede externa é bloqueada
 * e o app oferece ler o rótulo por foto com a IA.
 */
export async function lookupOpenFoodFacts(code) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 8000)
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_pt,brands,nutriments,serving_quantity`, { signal: ctl.signal })
    if (!r.ok) return null
    const d = await r.json()
    if (d.status !== 1 || !d.product) return null
    const p = d.product, n = p.nutriments || {}
    const kcal = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : null)
    if (kcal == null) return null
    return {
      name: [p.product_name_pt || p.product_name || 'Produto', p.brands?.split(',')[0]].filter(Boolean).join(' · '),
      per100: { kcal: +kcal || 0, protein: +n.proteins_100g || 0, carbs: +n.carbohydrates_100g || 0, fat: +n.fat_100g || 0, fiber: +n.fiber_100g || 0 },
      portionGrams: +p.serving_quantity || null,
    }
  } catch { return null } finally { clearTimeout(t) }
}
