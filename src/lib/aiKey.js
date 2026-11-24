/**
 * IA na versão hospedada (GitHub Pages): o app chama a API do Claude direto do navegador,
 * com a chave de API da própria pessoa. A chave fica SÓ no aparelho (localStorage) —
 * nunca vai para o GitHub, para o banco de dados nem para outra pessoa.
 *
 * Expõe a mesma interface do `sample` do claude.ai (`sample.json`, `sample.limits`),
 * então o resto do app (src/lib/ai.js) não precisa saber de onde vem a IA.
 */
// SDK carregado sob demanda (só quem usa IA baixa a biblioteca)
let Anthropic = null
const loadSdk = async () => (Anthropic ||= (await import('@anthropic-ai/sdk')).default)

const KEY = 'nutrivida-anthropic-key' // fora do prefixo "nutrivida:" de propósito: não é sincronizado
export const MODEL = 'claude-opus-5-5'

export function getApiKey() { try { return localStorage.getItem(KEY) || '' } catch { return '' } }
export function setApiKey(k) { try { k ? localStorage.setItem(KEY, k.trim()) : localStorage.removeItem(KEY) } catch { /* sem armazenamento */ } }

function parseJsonLoose(text) {
  const tries = [text]
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) tries.push(fence[1])
  const s = text.search(/[{[]/), e = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'))
  if (s >= 0 && e > s) tries.push(text.slice(s, e + 1))
  for (const t of tries) { try { return JSON.parse(t) } catch { /* próxima */ } }
  throw { code: 'invalid_json', message: 'Resposta sem JSON válido', text }
}

const toBase64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(String(r.result).split(',')[1])
  r.onerror = rej
  r.readAsDataURL(blob)
})

function mapError(e) {
  if (e?.code) return e
  if (!Anthropic) return { code: 'unavailable', message: e?.message }
  if (e instanceof Anthropic.APIUserAbortError || e?.name === 'AbortError') return { code: 'cancelled' }
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return { code: 'bad_key' }
  if (e instanceof Anthropic.RateLimitError) return { code: 'rate_limited' }
  if (e instanceof Anthropic.BadRequestError) return { code: 'bad_request', message: e.message }
  if (e instanceof Anthropic.APIConnectionError) return { code: 'network' }
  return { code: 'unavailable', message: e?.message }
}

export function createKeySample(apiKey) {
  let client = null

  async function run(input, opts = {}) {
    try { client ||= new (await loadSdk())({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 }) } catch { throw { code: 'network' } }
    const turns = typeof input === 'string' ? [{ role: 'user', content: input }] : input.map((m) => ({ role: m.role, content: m.content }))
    const images = opts.images ? [].concat(opts.images) : []
    if (images.length) {
      const last = turns[turns.length - 1]
      const blocks = await Promise.all(images.map(async (b) => ({
        type: 'image',
        source: { type: 'base64', media_type: ['image/png', 'image/webp', 'image/gif'].includes(b.type) ? b.type : 'image/jpeg', data: await toBase64(b) },
      })))
      last.content = [...blocks, { type: 'text', text: last.content }]
    }
    try {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default', // se o modelo recusar por engano, a API tenta outro modelo automaticamente
        output_config: { effort: opts.modelTier === 'quick' ? 'low' : 'medium' },
        system: 'Você é o assistente de nutrição do app NutriVida. Quando o pedido trouxer um formato JSON, responda somente com esse JSON, sem texto antes ou depois.',
        messages: turns,
      }, { signal: opts.signal })
      if (res.stop_reason === 'refusal') throw { code: 'refused' }
      return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
    } catch (e) { throw mapError(e) }
  }

  const sample = async (input, opts) => ({ text: await run(input, opts), truncated: false })
  sample.json = async (input, opts) => parseJsonLoose(await run(input, opts))
  sample.limits = async () => ({ images: { maxCount: 4 } })
  return sample
}

/** Valida a chave com uma chamada mínima. */
export async function testKey(apiKey) {
  const s = createKeySample(apiKey)
  const r = await s.json('Responda apenas com o JSON {"ok": true}', { modelTier: 'quick' })
  return r?.ok === true
}
