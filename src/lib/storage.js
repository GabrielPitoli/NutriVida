/**
 * Camada de persistência do NutriVida.
 *
 * Todos os dados são documentos JSON identificados por uma chave:
 *   profile · settings · customFoods · day-AAAA-MM-DD
 *
 * 1. Local (sempre): localStorage do aparelho — funciona offline e é instantâneo.
 * 2. Nuvem (quando disponível): um "adapter" remoto sincroniza os mesmos documentos.
 *    - Publicado no claude.ai: usa o banco de dados do Artifact (privado por usuário).
 *    - Hospedagem própria: troque por Supabase/Firebase — veja adapters/supabase.example.js.
 *
 * Resolução de conflitos: cada documento carrega `_u` (timestamp da última edição);
 * vence a versão mais recente.
 */
import { createClaudeAdapter } from './adapters/claude'

const PREFIX = 'nutrivida:'

const local = {
  get(key) {
    try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : null } catch { return null }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* armazenamento indisponível */ }
  },
  keys() {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length))
    } catch { return [] }
  },
}

// Memória como fallback caso localStorage esteja bloqueado (aba anônima, preview etc.)
const memory = new Map()

let remote = null
let status = 'local' // local | connecting | synced | saving | error
const listeners = new Set()
const setStatus = (s) => { status = s; listeners.forEach((fn) => fn(s)) }

const pending = new Map() // key -> timeout
const inflight = new Map() // key -> promise (uma escrita por vez por documento)

function scheduleRemote(key, value) {
  if (!remote) return
  clearTimeout(pending.get(key))
  setStatus('saving')
  pending.set(key, setTimeout(async () => {
    pending.delete(key)
    const prev = inflight.get(key) || Promise.resolve()
    const p = prev.then(() => remote.set(key, value)).catch((e) => { console.warn('[sync]', key, e); setStatus('error') })
    inflight.set(key, p)
    await p
    if (inflight.get(key) === p) inflight.delete(key)
    if (!pending.size && !inflight.size && status !== 'error') setStatus('synced')
  }, 700))
}

export const storage = {
  get(key) {
    return memory.has(key) ? memory.get(key) : local.get(key)
  },
  set(key, value) {
    const doc = { ...value, _u: Date.now() }
    memory.set(key, doc)
    local.set(key, doc)
    scheduleRemote(key, doc)
    return doc
  },
  dayKeys() { return storage.keysWithPrefix('day-') },
  keysWithPrefix(prefix) {
    const ks = new Set([...local.keys(), ...memory.keys()])
    return [...ks].filter((k) => k.startsWith(prefix)).sort()
  },
  /** Exclusão por "lápide" ({deleted:true}) para propagar entre aparelhos. */
  remove(key) { return storage.set(key, { deleted: true }) },
  get status() { return status },
  onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn) },
  get remoteName() { return remote?.name || null },

  /**
   * Conecta ao banco remoto (se houver) e faz a sincronização inicial.
   * `onRemoteDoc(key, doc)` é chamado para cada documento remoto mais novo que o local.
   */
  async connect(onRemoteDoc) {
    setStatus('connecting')
    const adapter = await createClaudeAdapter().catch(() => null)
    if (!adapter) { setStatus('local'); return false }
    remote = adapter
    try {
      const remoteDocs = await adapter.list() // { key: doc }
      const keys = new Set([...Object.keys(remoteDocs), ...local.keys(), ...memory.keys()])
      for (const key of keys) {
        const r = remoteDocs[key]
        const l = storage.get(key)
        if (r && (!l || (r._u || 0) > (l._u || 0))) {
          memory.set(key, r); local.set(key, r); onRemoteDoc?.(key, r)
        } else if (l && (!r || (l._u || 0) > (r._u || 0))) {
          await adapter.set(key, l) // envia o que só existe/está mais novo neste aparelho
        }
      }
      setStatus('synced')
      return true
    } catch (e) {
      console.warn('[sync] falha inicial', e)
      setStatus('error')
      return false
    }
  },
}
