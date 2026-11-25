/**
 * Internacionalização simples: o texto em português é a chave e o dicionário traduz para inglês.
 * Vantagem: o código continua legível em português e um texto sem tradução nunca some
 * (cai de volta no original).
 *
 *   t('Seu dia')                       → "Your day" (en) / "Seu dia" (pt)
 *   t('Faltam {n} ml', { n: 300 })     → interpolação
 */
import en from './en'

export const LANGS = [
  { id: 'pt', label: 'Português', short: 'PT' },
  { id: 'en', label: 'English', short: 'EN' },
]

function detect() {
  try {
    const s = JSON.parse(localStorage.getItem('nutrivida:settings') || '{}')
    if (s.lang === 'pt' || s.lang === 'en') return s.lang
  } catch { /* sem armazenamento */ }
  return (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

let lang = detect()
const missing = new Set()

export const getLang = () => lang
export const isEn = () => lang === 'en'
export const locale = () => (lang === 'en' ? 'en-US' : 'pt-BR')

export function setLang(l) {
  lang = l === 'en' ? 'en' : 'pt'
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR'
}
setLang(lang)

export function t(text, vars) {
  if (text == null) return ''
  let out = text
  if (lang === 'en') {
    const tr = en[text]
    if (tr != null) out = tr
    else if (import.meta.env?.DEV && !missing.has(text)) { missing.add(text); console.warn('[i18n] sem tradução:', text) }
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
  return out
}

/** Escolhe entre duas formas conforme a quantidade (ex.: plural). */
export const plural = (n, one, many, vars) => t(n === 1 ? one : many, { n, ...vars })
