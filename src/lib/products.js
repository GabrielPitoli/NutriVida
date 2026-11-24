// Base offline de produtos brasileiros com código de barras (Open Food Facts, licença ODbL).
// Carregada sob demanda (o arquivo é grande); na versão de arquivo único ela vai embutida.
let cache = null
export function loadProducts() {
  if (!cache) {
    cache = import('../../public/products-br.json').then((m) => {
      const d = m.default || m
      const byCode = new Map()
      const list = d.items.map((x) => {
        const [code, name, brand, kcal, protein, carbs, fat, fiber, sugar, satfat, sodiumMg, nutriscore, servingG] = x
        const p = {
          id: 'off-' + code, barcode: code, name: brand ? `${name} · ${brand}` : name, category: 'Produtos', product: true,
          per100: { kcal, protein, carbs, fat, fiber }, extra: { sugar, satfat, sodiumMg: sodiumMg ?? 0 }, nutriscore: 'abcde'.includes(nutriscore || 'x') ? nutriscore : null,
          unit: servingG ? { label: 'porção', grams: servingG } : null,
        }
        byCode.set(code, p)
        return p
      })
      return { byCode, list, count: list.length }
    }).catch(() => ({ byCode: new Map(), list: [], count: 0 }))
  }
  return cache
}

/** Procura pelo código (aceita EAN-13 com/sem zero à esquerda e UPC-A). */
export async function findProduct(code) {
  const { byCode } = await loadProducts()
  return byCode.get(code) || byCode.get(code.replace(/^0+/, '')) || byCode.get('0' + code) || null
}
