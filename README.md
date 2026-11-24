# NutriVida

**Acesse o app:** https://gabrielpitoli.github.io/NutriVida/

No Android, abra o link no Chrome e toque em **⋮ → Instalar app**. No iPhone, abra no Safari e toque em **Compartilhar → Adicionar à Tela de Início**.

App web mobile-first (PWA) de nutrição, hidratação, treinos e metas. Feito com React, Tailwind CSS e Lucide.

## Funcionalidades
- **Hoje:** anel de calorias (meta − consumidas + treino), barras de proteínas, carboidratos e gorduras, copo de água animado (+200/+300/+500 ml ou outro valor), contador de refeições e gráfico dos últimos 7 dias.
- **Diário:** 6 refeições padrão, mais refeições personalizadas. Busca em mais de 70 alimentos brasileiros (por porção caseira ou em gramas) e cadastro manual. Kcal, P, C, G e fibras por item e por refeição. Aba de atividades com gasto calculado por MET.
- **Receitas:** 46 receitas com fotos, filtros por refeição e objetivo, ingredientes que dá para marcar, modo de preparo, tabela nutricional e botão "Registrar no meu dia".
- **Cardápios:** Hipertrofia, Energia e Definição, com porções ajustadas automaticamente à sua meta calórica e aplicação ao dia em um toque.
- **Metas:** cadastro inicial em 3 passos. Cálculo da meta calórica (TMB de Mifflin-St Jeor × fator de atividade ± ajuste do objetivo, com piso de segurança), dos macros (g/kg de proteína e % de gordura), da água (35 ml/kg) e das fibras. Também dá para ajustar tudo manualmente e escolher tema claro, escuro ou do sistema.
- **Recompensas (estilo Duolingo):** 5 missões diárias valem XP. Cumprir 3 delas garante o dia e mantém a ofensiva 🔥. Tem níveis de "Iniciante" a "Ícone", 12 medalhas, calendário da semana e aviso quando a ofensiva está em risco. Tudo é calculado a partir dos registros, então fica igual em qualquer aparelho.
- **Botão "+" para registrar rápido:**
  - **Foto do prato:** a IA identifica os alimentos e estima as porções. Dá para ajustar as gramas antes de salvar.
  - **Nutri IA:** chat por texto ou voz. Conte o que comeu e ela calcula e propõe o registro; também tira dúvidas e sugere refeições.
  - **Código de barras:** foto do código pela câmera nativa ou digitação dos números; em hospedagem própria também há câmera ao vivo. O app consulta primeiro uma **base offline com 25 mil produtos vendidos no Brasil**, depois o Open Food Facts online (só em hospedagem própria). Se o produto não estiver em nenhuma das duas, a IA lê a tabela nutricional pela foto. O produto fica salvo para as próximas leituras.
- **Qualidade nutricional:** carinhas de Excelente 🟢 a Péssimo 🔴 em cada alimento, produto, receita, refeição e no resumo do dia, com os motivos (rico em proteína, muito açúcar, muito sódio etc.). A nota segue esta ordem de prioridade:
  1. nota definida à mão para os alimentos básicos;
  2. Nutri-Score do produto, limitado pelo cálculo próprio;
  3. nota da IA;
  4. cálculo próprio por densidade de nutrientes (`src/lib/quality.js`).
- **Minhas receitas:** crie receitas com foto, ingredientes e modo de preparo. As calorias são calculadas pelos ingredientes do banco de alimentos. Também dá para pedir que a IA monte a receita a partir de uma ideia.
- **Fotos das receitas:** vêm do Openverse, com licenças livres (CC BY, CC BY-SA, CC0). Autor e licença aparecem em cada receita (`src/data/photoCredits.json`). Para baixar ou trocar fotos: `python3 scripts/photos.py receita-id="termo de busca"`.
- **Celebrações:** confete ao bater as metas, ao subir de nível e ao garantir a ofensiva do dia.

### Como ativar a IA
O app não traz nenhuma chave de IA embutida. Quem quiser usar a foto do prato, a Nutri IA, a leitura de rótulo ou a criação de receitas com IA ativa com a **própria chave da API do Claude**:

1. Crie uma conta em [console.anthropic.com](https://console.anthropic.com), adicione créditos e gere uma chave em **API Keys**.
2. No app, vá em **Metas → Inteligência artificial**, cole a chave e toque em **Salvar e testar**.

A chave fica salva **só no seu aparelho** e vai direto do seu navegador para a API da Anthropic. Ela não passa por nenhum servidor do projeto e não fica visível para mais ninguém. O custo é por uso, na sua própria conta da API: uma foto do prato custa em torno de US$ 0,01 a 0,03.

## Privacidade e acesso
- **Código:** o repositório é público. Qualquer pessoa pode ver e copiar o código, mas só o dono do repositório altera o que está aqui.
- **Uso do app:** qualquer pessoa com o link usa o app. Não existe cadastro, login nem servidor do projeto.
- **Dados:** refeições, água, treinos, perfil e receitas de cada pessoa ficam **apenas no navegador do próprio aparelho** (localStorage). Ninguém vê os dados de outra pessoa, nem o dono do repositório. Se você limpar os dados do navegador ou desinstalar o app, os registros somem.
- **IA:** cada pessoa usa a própria chave, como explicado acima. Nenhuma chave ou conta fica vinculada ao app ou ao repositório.

### Para desenvolvedores
`src/lib/storage.js` guarda tudo no aparelho e já está pronto para sincronizar com um banco remoto, onde vence a versão mais recente. O exemplo com Supabase (SQL e passo a passo) está em `src/lib/adapters/supabase.example.js`.

## Base de produtos (código de barras)
`public/products-br.json` é gerado a partir do export público do Open Food Facts (licença ODbL, © colaboradores do Open Food Facts):
```bash
curl -sL https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz | gunzip | python3 scripts/build-products.py
```

## Rodar
```bash
npm install
npm run dev          # http://localhost:5173 (use o IP da rede para abrir no celular)
npm run build        # PWA em dist/ (pronto para Vercel/Netlify)
npm run build:single # HTML único em dist-single/
```
