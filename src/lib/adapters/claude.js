/**
 * Adapter de nuvem para quando o app roda publicado como Artifact no claude.ai.
 * Cada pessoa tem seus dados privados em data/users/<id>/<chave>.
 * Fora do claude.ai `window.claude` não existe e o app usa só o armazenamento local.
 */
export async function createClaudeAdapter() {
  const claude = window.claude
  if (!claude?.use) return null
  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')])
  if (!db || !user) return null
  const id = await user.id()
  if (!id) return null
  const col = db.collection('data/users/' + id)

  const withRetry = async (fn) => {
    try { return await fn() } catch (e) {
      if (e?.code === 'unavailable') { await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000)); return fn() }
      throw e
    }
  }

  return {
    name: 'Nuvem',
    async list() {
      const snap = await withRetry(() => col.limit(1000).get())
      const out = {}
      snap.docs.forEach((d) => { if (d.exists) out[d.id] = d.data() })
      return out
    },
    async set(key, value) {
      // Remove valores undefined (não são JSON válido)
      const body = JSON.parse(JSON.stringify(value))
      await withRetry(() => col.doc(key).set(body))
    },
  }
}
