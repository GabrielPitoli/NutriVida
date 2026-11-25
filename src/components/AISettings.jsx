import { useEffect, useState } from 'react'
import { Sparkles, KeyRound, Check, Loader2, Trash2, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { getAI, resetAI, aiErrorText } from '../lib/ai'
import { getApiKey, setApiKey, testKey } from '../lib/aiKey'

import { t } from '../i18n';

export default function AISettings() {
  const [provider, setProvider] = useState(null) // claude | apikey | null
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [state, setState] = useState('') // testing | ok | erro
  const [err, setErr] = useState('')
  const saved = getApiKey()

  const refresh = () => getAI().then((ai) => { setProvider(ai?.provider || null); setLoading(false) })
  useEffect(() => { refresh() }, [])

  const save = async () => {
    setState('testing'); setErr('')
    try {
      await testKey(key.trim())
      setApiKey(key.trim()); setKey(''); resetAI(); await refresh(); setState('ok')
    } catch (e) { setState('erro'); setErr(aiErrorText(e)) }
  }
  const remove = () => { setApiKey(''); resetAI(); refresh(); setState('') }

  if (loading) return <div className="card"><Loader2 className="mx-auto animate-spin text-violet-500" /></div>

  if (provider === 'claude') {
    return (
      <div className="card flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300"><Sparkles size={20} /></span>
        <p className="text-[13px]"><b>{t('IA ativa pela sua conta do Claude.')}</b><br /><span className="muted">{t(
          'Foto do prato, Nutri IA, leitura de rótulo e criação de receitas já funcionam. Não precisa de chave.'
        )}</span></p>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${provider ? 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>{provider ? <Check size={20} /> : <KeyRound size={20} />}</span>
        <div className="text-[13px]">
          <b>{provider ? t('IA ativa com sua chave de API') : t('IA desligada')}</b>
          <p className="muted">{provider
            ? t('Chave salva neste aparelho (termina em …{k}).', { k: saved.slice(-4) })
            : t('Para usar foto do prato, Nutri IA, leitura de rótulo e criar receitas, cole uma chave da API do Claude.')}</p>
        </div>
      </div>

      {!provider && (
        <>
          <ol className="list-decimal space-y-1 pl-5 text-[12.5px] muted">
            <li>{t('Crie uma conta em')} <a className="font-semibold text-violet-600 underline dark:text-violet-300" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">{t('console.anthropic.com')}</a> {t('e adicione créditos (Billing).')}</li>
            <li>{t('Em')} <b>{t('API Keys')}</b>{t(', toque em')} <b>{t('Create Key')}</b> {t('e copie a chave (começa com')} <code>{t('sk-ant-')}</code>).</li>
            <li>{t('Cole abaixo e toque em')} <b>{t('Salvar e testar')}</b>.</li>
          </ol>
          <div className="relative">
            <input id="api-key" type={show ? 'text' : 'password'} autoComplete="off" spellCheck={false} className="input pr-12 font-mono text-sm" placeholder={t('sk-ant-...')} value={key} onChange={(e) => setKey(e.target.value)} />
            <button type="button" aria-label={show ? t('Esconder chave') : t('Mostrar chave')} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <button className="btn w-full bg-violet-600 !py-3 text-white" disabled={!key.trim().startsWith('sk-') || state === 'testing'} onClick={save}>
            {state === 'testing' ? <><Loader2 size={16} className="animate-spin" /> {t('Testando chave…')}</> : <><Sparkles size={16} /> {t('Salvar e testar')}</>}
          </button>
          {state === 'erro' && <p className="flex gap-2 rounded-2xl bg-rose-50 p-3 text-[13px] text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{err}</p>}
        </>
      )}
      {provider && (
        <>
          {state === 'ok' && <p className="rounded-2xl bg-green-50 p-3 text-[13px] text-green-800 dark:bg-green-400/10 dark:text-green-300">{t('Chave testada e salva! A IA já está funcionando.')}</p>}
          <button className="btn-danger w-full !py-2.5" onClick={remove}><Trash2 size={15} /> {t('Remover chave deste aparelho')}</button>
        </>
      )}
      <p className="flex gap-2 text-[11.5px] muted"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> {t(
          'A chave fica só neste aparelho e é enviada apenas para a API da Anthropic. Ela não vai para o GitHub nem para mais ninguém. Cada uso cobra centavos da sua conta da API (uma foto do prato custa em torno de US$ 0,01 a 0,03).'
        )}</p>
    </div>
  );
}
