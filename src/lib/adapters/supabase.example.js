/**
 * EXEMPLO (não importado por padrão) — adapter para Supabase em hospedagem própria.
 *
 * 1) npm i @supabase/supabase-js
 * 2) Crie a tabela:
 *
 *    create table nutrivida_docs (
 *      user_id uuid references auth.users not null,
 *      key text not null,
 *      data jsonb not null,
 *      updated_at timestamptz default now(),
 *      primary key (user_id, key)
 *    );
 *    alter table nutrivida_docs enable row level security;
 *    create policy "dono lê/escreve" on nutrivida_docs
 *      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
 *
 * 3) Em src/lib/storage.js troque `createClaudeAdapter` por `createSupabaseAdapter`.
 */
import { createClient } from '@supabase/supabase-js'

export async function createSupabaseAdapter() {
  const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // exija login antes (ex.: supabase.auth.signInWithOtp)

  return {
    name: 'Supabase',
    async list() {
      const { data, error } = await supabase.from('nutrivida_docs').select('key, data')
      if (error) throw error
      return Object.fromEntries(data.map((r) => [r.key, r.data]))
    },
    async set(key, value) {
      const { error } = await supabase.from('nutrivida_docs')
        .upsert({ user_id: user.id, key, data: value, updated_at: new Date().toISOString() })
      if (error) throw error
    },
  }
}
