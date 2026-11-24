// Converte dist-single/index.html em um fragmento para publicação (sem <html>/<head>/<body>).
import { readFileSync, writeFileSync } from 'node:fs'
const html = readFileSync('dist-single/index.html', 'utf8')
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n')
const styles = pick(/<style[\s\S]*?<\/style>/g)
const scripts = pick(/<script[\s\S]*?<\/script>/g)
const fonts = pick(/<link[^>]+fonts\.googleapis\.com\/css2[^>]*>/g)
const out = `<title>NutriVida</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#f4f8f6">
${fonts}
${styles}
<div id="root"></div>
${scripts}
`
writeFileSync('dist-single/nutrivida.html', out)
console.log('ok', (out.length / 1024).toFixed(0) + ' KB')
