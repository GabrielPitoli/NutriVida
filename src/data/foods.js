// Base de alimentos (valores aproximados por 100 g/ml — referência TACO/USDA).
// Formato compacto: [id, nome, categoria, kcal, proteína, carboidrato, gordura, fibra, porção caseira?]
// porção caseira: [rótulo, gramas] — ex.: ['unidade', 50]

const RAW = [
  // Cereais, pães e massas
  ['arroz-branco', 'Arroz branco cozido', 'Cereais', 128, 2.5, 28.1, 0.2, 1.6, ['colher de servir', 45]],
  ['arroz-integral', 'Arroz integral cozido', 'Cereais', 124, 2.6, 25.8, 1.0, 2.7, ['colher de servir', 45]],
  ['aveia', 'Aveia em flocos', 'Cereais', 394, 13.9, 66.6, 8.5, 9.1, ['colher de sopa', 15]],
  ['pao-frances', 'Pão francês', 'Pães', 300, 8.0, 58.6, 3.1, 2.3, ['unidade', 50]],
  ['pao-integral', 'Pão de forma integral', 'Pães', 253, 9.4, 49.9, 3.7, 6.9, ['fatia', 25]],
  ['tapioca', 'Tapioca (goma hidratada)', 'Cereais', 240, 0.0, 60.0, 0.0, 0.3, ['colher de sopa', 20]],
  ['cuscuz', 'Cuscuz de milho cozido', 'Cereais', 113, 2.2, 25.3, 0.7, 2.1, ['fatia média', 100]],
  ['macarrao', 'Macarrão cozido', 'Massas', 158, 5.8, 30.9, 0.9, 1.8, ['pegador', 110]],
  ['macarrao-integral', 'Macarrão integral cozido', 'Massas', 124, 5.3, 26.5, 0.5, 3.9, ['pegador', 110]],
  ['granola', 'Granola', 'Cereais', 421, 10.0, 64.0, 14.0, 7.0, ['colher de sopa', 12]],
  ['crepioca-mix', 'Farinha de mandioca', 'Cereais', 361, 1.6, 87.9, 0.3, 6.4, ['colher de sopa', 16]],
  ['quinoa', 'Quinoa cozida', 'Cereais', 120, 4.4, 21.3, 1.9, 2.8, ['colher de sopa', 25]],
  ['wrap', 'Pão sírio / wrap integral', 'Pães', 275, 9.0, 52.0, 3.5, 5.0, ['unidade', 50]],

  // Leguminosas
  ['feijao-carioca', 'Feijão carioca cozido', 'Leguminosas', 76, 4.8, 13.6, 0.5, 8.5, ['concha', 86]],
  ['feijao-preto', 'Feijão preto cozido', 'Leguminosas', 77, 4.5, 14.0, 0.5, 8.4, ['concha', 86]],
  ['lentilha', 'Lentilha cozida', 'Leguminosas', 93, 6.3, 16.3, 0.5, 7.9, ['concha', 86]],
  ['grao-de-bico', 'Grão-de-bico cozido', 'Leguminosas', 164, 8.9, 27.4, 2.6, 7.6, ['colher de sopa', 22]],

  // Carnes, ovos e peixes
  ['frango-peito', 'Peito de frango grelhado', 'Proteínas', 159, 32.0, 0.0, 2.5, 0.0, ['filé médio', 120]],
  ['frango-desfiado', 'Frango desfiado cozido', 'Proteínas', 163, 31.5, 0.0, 3.2, 0.0, ['colher de sopa', 25]],
  ['ovo', 'Ovo inteiro cozido', 'Proteínas', 146, 13.3, 0.6, 9.5, 0.0, ['unidade', 50]],
  ['clara', 'Clara de ovo', 'Proteínas', 52, 10.9, 0.7, 0.2, 0.0, ['unidade', 33]],
  ['patinho', 'Patinho moído refogado', 'Proteínas', 219, 35.9, 0.0, 7.3, 0.0, ['colher de sopa', 25]],
  ['alcatra', 'Alcatra grelhada', 'Proteínas', 241, 31.9, 0.0, 11.6, 0.0, ['bife médio', 100]],
  ['tilapia', 'Tilápia grelhada', 'Proteínas', 128, 26.2, 0.0, 2.7, 0.0, ['filé', 120]],
  ['salmao', 'Salmão grelhado', 'Proteínas', 229, 23.9, 0.0, 14.0, 0.0, ['posta', 120]],
  ['atum', 'Atum em água (lata)', 'Proteínas', 116, 25.5, 0.0, 0.8, 0.0, ['lata drenada', 120]],
  ['peito-peru', 'Peito de peru fatiado', 'Proteínas', 111, 18.0, 3.0, 2.8, 0.0, ['fatia', 15]],
  ['tofu', 'Tofu', 'Proteínas', 76, 8.1, 1.9, 4.8, 0.3, ['fatia', 50]],

  // Laticínios e suplementos
  ['leite-desnatado', 'Leite desnatado', 'Laticínios', 35, 3.4, 5.0, 0.1, 0.0, ['copo (200 ml)', 200]],
  ['leite-integral', 'Leite integral', 'Laticínios', 61, 3.2, 4.7, 3.3, 0.0, ['copo (200 ml)', 200]],
  ['iogurte-natural', 'Iogurte natural desnatado', 'Laticínios', 41, 3.8, 5.8, 0.3, 0.0, ['pote', 170]],
  ['iogurte-grego', 'Iogurte grego zero', 'Laticínios', 66, 9.0, 4.5, 1.5, 0.0, ['pote', 100]],
  ['queijo-minas', 'Queijo minas frescal', 'Laticínios', 264, 17.4, 3.2, 20.2, 0.0, ['fatia', 30]],
  ['queijo-cottage', 'Queijo cottage', 'Laticínios', 98, 11.1, 3.4, 4.3, 0.0, ['colher de sopa', 30]],
  ['requeijao-light', 'Requeijão light', 'Laticínios', 180, 11.0, 4.0, 13.0, 0.0, ['colher de sopa', 15]],
  ['whey', 'Whey protein concentrado', 'Suplementos', 400, 80.0, 8.0, 6.0, 0.0, ['scoop', 30]],
  ['creatina', 'Creatina', 'Suplementos', 0, 0, 0, 0, 0, ['dose', 5]],

  // Frutas
  ['banana', 'Banana prata', 'Frutas', 98, 1.3, 26.0, 0.1, 2.0, ['unidade', 70]],
  ['maca', 'Maçã', 'Frutas', 56, 0.3, 15.2, 0.0, 1.3, ['unidade', 130]],
  ['mamao', 'Mamão papaia', 'Frutas', 40, 0.5, 10.4, 0.1, 1.0, ['fatia', 150]],
  ['morango', 'Morango', 'Frutas', 30, 0.9, 6.8, 0.3, 1.7, ['unidade', 12]],
  ['laranja', 'Laranja pera', 'Frutas', 37, 1.0, 8.9, 0.1, 0.8, ['unidade', 140]],
  ['abacate', 'Abacate', 'Frutas', 96, 1.2, 6.0, 8.4, 6.3, ['colher de sopa', 30]],
  ['manga', 'Manga palmer', 'Frutas', 72, 0.4, 19.4, 0.2, 1.6, ['fatia', 80]],
  ['melancia', 'Melancia', 'Frutas', 33, 0.9, 8.1, 0.0, 0.1, ['fatia', 200]],
  ['acai', 'Açaí (polpa sem açúcar)', 'Frutas', 58, 0.8, 6.2, 3.9, 2.6, ['pacote', 100]],
  ['uva', 'Uva', 'Frutas', 53, 0.7, 13.6, 0.2, 0.9, ['cacho pequeno', 100]],
  ['mirtilo', 'Frutas vermelhas (mix)', 'Frutas', 50, 0.8, 11.5, 0.3, 2.8, ['xícara', 140]],

  // Verduras e legumes
  ['alface', 'Alface', 'Vegetais', 11, 1.3, 1.7, 0.2, 1.8, ['prato raso', 40]],
  ['tomate', 'Tomate', 'Vegetais', 15, 1.1, 3.1, 0.2, 1.2, ['unidade', 100]],
  ['brocolis', 'Brócolis cozido', 'Vegetais', 25, 2.1, 4.4, 0.5, 3.4, ['xícara', 90]],
  ['cenoura', 'Cenoura crua', 'Vegetais', 34, 1.3, 7.7, 0.2, 3.2, ['unidade média', 90]],
  ['abobrinha', 'Abobrinha refogada', 'Vegetais', 32, 1.1, 4.3, 1.4, 1.6, ['colher de sopa', 30]],
  ['batata-doce', 'Batata-doce cozida', 'Tubérculos', 77, 0.6, 18.4, 0.1, 2.2, ['unidade média', 150]],
  ['batata', 'Batata inglesa cozida', 'Tubérculos', 52, 1.2, 11.9, 0.0, 1.3, ['unidade média', 130]],
  ['mandioca', 'Mandioca cozida', 'Tubérculos', 125, 0.6, 30.1, 0.3, 1.6, ['pedaço', 100]],
  ['espinafre', 'Espinafre refogado', 'Vegetais', 67, 2.7, 4.2, 5.4, 2.5, ['colher de sopa', 25]],
  ['salada-mista', 'Salada mista (folhas + tomate + pepino)', 'Vegetais', 16, 1.0, 3.0, 0.2, 1.6, ['prato', 120]],

  // Gorduras, oleaginosas e outros
  ['azeite', 'Azeite de oliva', 'Gorduras', 884, 0.0, 0.0, 100.0, 0.0, ['colher de sopa', 13]],
  ['pasta-amendoim', 'Pasta de amendoim integral', 'Gorduras', 588, 25.0, 20.0, 50.0, 6.0, ['colher de sopa', 15]],
  ['castanha-para', 'Castanha-do-pará', 'Oleaginosas', 643, 14.5, 15.1, 63.5, 7.9, ['unidade', 4]],
  ['castanha-caju', 'Castanha de caju', 'Oleaginosas', 570, 18.5, 29.1, 46.3, 3.7, ['punhado', 20]],
  ['amendoas', 'Amêndoas', 'Oleaginosas', 581, 18.6, 29.5, 47.3, 11.6, ['punhado', 20]],
  ['chia', 'Semente de chia', 'Sementes', 486, 16.5, 42.1, 30.7, 34.4, ['colher de sopa', 12]],
  ['mel', 'Mel', 'Doces', 309, 0.0, 84.0, 0.0, 0.0, ['colher de sopa', 20]],
  ['chocolate-70', 'Chocolate 70% cacau', 'Doces', 579, 7.8, 36.0, 43.0, 10.9, ['quadradinho', 10]],
  ['cafe', 'Café sem açúcar', 'Bebidas', 2, 0.1, 0.3, 0.0, 0.0, ['xícara', 100]],
  ['suco-laranja', 'Suco de laranja natural', 'Bebidas', 45, 0.7, 10.4, 0.2, 0.2, ['copo (250 ml)', 250]],
  ['agua-coco', 'Água de coco', 'Bebidas', 22, 0.0, 5.3, 0.0, 0.1, ['copo (250 ml)', 250]],
  ['hummus', 'Homus', 'Leguminosas', 177, 7.9, 20.1, 8.6, 6.0, ['colher de sopa', 20]],
]

export const FOODS = RAW.map(([id, name, category, kcal, protein, carbs, fat, fiber, unit]) => ({
  id, name, category, per100: { kcal, protein, carbs, fat, fiber },
  unit: unit ? { label: unit[0], grams: unit[1] } : null,
}))

export const FOOD_CATEGORIES = [...new Set(FOODS.map((f) => f.category))]

// Nota de qualidade nutricional definida por nutricionista (5 excelente … 1 péssimo).
const QUALITY = {
  'arroz-branco': 3, 'arroz-integral': 4, 'aveia': 5, 'pao-frances': 3, 'pao-integral': 4, 'tapioca': 3, 'cuscuz': 3, 'macarrao': 3,
  'macarrao-integral': 4, 'granola': 3, 'crepioca-mix': 2, 'quinoa': 5, 'wrap': 4, 'feijao-carioca': 5, 'feijao-preto': 5, 'lentilha': 5,
  'grao-de-bico': 5, 'frango-peito': 5, 'frango-desfiado': 5, 'ovo': 5, 'clara': 5, 'patinho': 4, 'alcatra': 4, 'tilapia': 5, 'salmao': 5,
  'atum': 5, 'peito-peru': 3, 'tofu': 5, 'leite-desnatado': 4, 'leite-integral': 3, 'iogurte-natural': 4, 'iogurte-grego': 5,
  'queijo-minas': 3, 'queijo-cottage': 4, 'requeijao-light': 2, 'whey': 4, 'creatina': 3, 'banana': 5, 'maca': 5, 'mamao': 5, 'morango': 5,
  'laranja': 5, 'abacate': 5, 'manga': 4, 'melancia': 4, 'acai': 4, 'uva': 4, 'mirtilo': 5, 'alface': 5, 'tomate': 5, 'brocolis': 5,
  'cenoura': 5, 'abobrinha': 5, 'batata-doce': 5, 'batata': 4, 'mandioca': 4, 'espinafre': 5, 'salada-mista': 5, 'azeite': 4,
  'pasta-amendoim': 4, 'castanha-para': 4, 'castanha-caju': 4, 'amendoas': 4, 'chia': 5, 'mel': 2, 'chocolate-70': 3, 'cafe': 4,
  'suco-laranja': 3, 'agua-coco': 4, 'hummus': 4,
}
for (const f of FOODS) if (QUALITY[f.id]) f.q = QUALITY[f.id]
export const FOODS_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]))
