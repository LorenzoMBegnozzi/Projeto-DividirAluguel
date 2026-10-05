# 10 — Design system

Este documento tem duas partes. A **Parte A** é o guia em vigor: tokens, primitivos, marca e o que é proibido. A **Parte B** é a auditoria de 05/10/2026, feita antes da migração e mantida como histórico.

- **Galeria viva:** `/dev/ui` (só com `npm run dev`; a rota não entra no build). Mostra os primitivos e a marca nos dois temas, lado a lado.
- **Checagem:** `npm run lint` roda o oxlint e `scripts/check-design.mjs`, e falha se voltar estilo solto. `npm run lint:design -- --report` mostra só a contagem.
- **Migração tela a tela:** a tabela "de → para" usada na Etapa 3 está em [design-system-migracao.md](design-system-migracao.md).
- **Capturas:** antes e depois de 18 telas em 390/1440, claro/escuro, em [capturas/design-system/](capturas/design-system/). As montagens lado a lado ficam em `comparativos/` e são geradas por `montar-comparativos.sh`.

---

# Parte A — Guia

## A1. Tokens (`frontend/src/index.css`)

Tudo que tem namespace no Tailwind 4 fica no `@theme` e vira utilitário (`text-h2`, `bg-brand`, `rounded-xl`, `shadow-md`). O que não tem namespace fica em `:root`, como variável, e é usado com a sintaxe de propriedade: `z-(--z-modal)`, `duration-(--dur-base)`.

### Cor

Cada papel tem a sua versão para os temas claro e escuro, ambas conferidas no AA: texto com pelo menos 4,5:1, borda de campo e foco com pelo menos 3:1.

| Papel | Token | Uso |
|---|---|---|
| Fundos | `paper` · `surface` · `surface-sunk` | página · cartão · painel interno, trilho e campo desabilitado |
| Linhas | `line` · `line-strong` · `field` | divisória e borda de cartão · hover e destaque · **borda de campo e controle** (3:1) |
| Texto | `ink` · `ink-2` · `ink-3` | título · corpo · apoio e metadado (todos AA no `paper` e no `surface`) |
| Marca | `brand` · `brand-strong` · `brand-tint` · `on-brand` | ação principal · texto sobre o tint · seleção e info · texto sobre `brand` |
| Segundo tom | `coral` · `coral-strong` · `coral-tint` | lado "anunciar" e chamadas de destaque |
| Só marca | `coral-bright` | metade coral do logo e ilustração. **Nunca em texto** (não passa no AA) |
| Estados | `leaf` / `mel` / `danger` (+ `-tint`) · `star` | sucesso / aviso / erro · estrelas da avaliação |
| Outros | `inverse` · `on-inverse` · `scrim` · `focus` | botão e selo escuros · véu do modal · anel de foco |

### Tipografia

A família é uma só, Schibsted Grotesk (pesos 400 a 800, `display=swap`), com uma fonte de fallback de métricas ajustadas para o texto não pular quando a fonte carrega. Para CPF e código, `font-mono`.

| Token | Tamanho / altura de linha | Uso |
|---|---|---|
| `text-display` | 42–76 px fluido, 800 | título do topo da landing |
| `text-landing-h2` | 32–48 px fluido, 800 | título de seção da landing |
| `text-price` | 52 px, 800 | preço grande da seção Preços |
| `text-h1` | 28→32 px, 800 | título de tela (`pageTitleClass`) |
| `text-h2` | 24/30, 800 | título de seção, de modal e de cartão de autenticação |
| `text-h3` | 18/24, 700 | título de cartão |
| `text-lead` | 18/28 | parágrafo de abertura (landing) |
| `text-body` | 16/24 | texto corrido, campo, mensagem de chat |
| `text-small` | 14/20 | texto de apoio, botão, item de lista |
| `text-caption` | 13/18 | legenda, metadado, ajuda e erro de campo |
| `text-label` | 12/16, 800, 0,12em | kicker em caixa alta (`kickerClass`) |
| `text-micro` | 11/14 | só selo e contador; nunca texto corrido |
| `text-logo-sm/md/lg` | 16 / 20 / 28 | nome no `Logo`; não use fora dele |

O peso e o espaçamento vêm do token. Só acrescente `font-*` quando o desenho pedir de fato, por exemplo `font-semibold` num rótulo.

### Raio, sombra, camada e movimento

- **Raio:**
  - `rounded-xs` (4): o "rabinho" da bolha;
  - `-sm` (8): selo e tag;
  - `-md` (12): botão, campo e item;
  - `-lg` (16): painel interno e popover;
  - `-xl` (22): cartão e modal;
  - `rounded-full`: pílula e avatar.
- **Sombra:** `shadow-sm` para o cartão em repouso, `shadow-md` para o hover e `shadow-lg` para popover, menu e modal. O tema escuro troca os valores sozinho.
- **Camada:**
  - `--z-raised` 10;
  - `--z-sticky` 20 (NavBar e BottomNav);
  - `--z-dropdown` 30 (notificações e autocomplete);
  - `--z-overlay` 40 (palco 3D da landing);
  - `--z-modal` 50 (modal e cabeçalho fixo da landing);
  - `--z-toast` 60.
- **Movimento:** `--dur-fast` 150 ms, `--dur-base` 250 ms e `--dur-slow` 400 ms. As curvas são `ease-standard`, `ease-out` e `ease-spring`. Toda animação tem `motion-reduce:` ou fica dentro de `@media (prefers-reduced-motion)`.

### Ilustração (`--art-*`, `--device-*`, `--radius-device*`)

São tokens só para arte decorativa com `aria-hidden`: a tela e o corpo do celular 3D e as mini-ilustrações do mosaico e da demonstração da landing. Eles não viram utilitário e **não podem ser usados em interface**.

- **Tamanhos de letra fracionados:** `--art-text-2xs` a `-xl`. A arte foi desenhada nesses tamanhos, e arredondar deformaria os desenhos.
- **"Fotos" de anúncio desenhadas:** `--art-photo-a…d`.
- **Sombras duras de objeto flutuando:** `--art-shadow-*` e `--art-drop-*`.
- **Cores do aparelho em grafite:** `--device-*`. O tema escuro clareia o corpo para ele não sumir no fundo.

## A2. Primitivos (`frontend/src/components/ui/`)

Importe de `components/ui`. Quando o elemento não pode virar o componente (um `<a href>` externo, um `<button>` que já tem outro papel), use a função de classe equivalente, como `buttonClass()`, `fieldClass()`, `cardClass()` ou `chipClass()`.

| Primitivo | Quando usar | Notas |
|---|---|---|
| `Button` / `ButtonLink` | Toda ação. Variantes: `primary` (uma por tela), `secondary` (contorno), `ghost` (ação de linha ou ícone), `danger`, `accent` (anunciar), `inverse` | Tamanhos `sm` 36 px (vira 44 em tela de toque), `md` 44 px e `lg` 52 px. Só ícone: `icon` + `aria-label`. Use `loading` só se o texto não muda |
| `Input` / `Textarea` / `Select` / `Checkbox` | Campo **com rótulo visível** | Ligam o label, a dica e o erro com `aria-describedby`. Sem rótulo, use `fieldClass()` no elemento |
| `Toggle` | Liga/desliga com efeito imediato | `role="switch"` |
| `Card` | Cartão de conteúdo. `tone`: `surface`, `sunk` (painel interno), `danger` ou `brand`. `padding`: `sm`, `md` ou `lg`. `as` muda a tag | Para cartão clicável, use `interactive` |
| `Modal` | Diálogo | Foca o painel e devolve o foco ao fechar. Esc só fecha se você passar `onEscape` |
| `Chip` | Escolha com estado (`aria-pressed`) | Se o botão original não tinha `aria-pressed`, use `chipClass()` |
| `Badge` | Rótulo de status ou tipo, não clicável | `tone`: neutral, brand, success, warning, danger, accent, inverse |
| `Alert` | Aviso dentro da página: info, success, warning, danger | Não acrescenta `role`. Ponha `role="alert"` só onde o anúncio é desejado |
| `EmptyState` | Lista ou área vazia | O título é a frase de vazio; a explicação vai em children |
| `Skeleton` | Espaço reservado durante o carregamento | Tem `aria-hidden` |

Atalhos de classe:
- `pageTitleClass` (h1 de tela);
- `kickerClass`;
- `labelClass`, `hintClass`, `errorClass`;
- `focusRing` (para `<button>` e `<a>` que não são primitivos);
- `cx` (junta classes **sem** merge: para vencer a classe da variante, use o modificador `!`).

## A3. Marca

- **Componentes (`components/Logo.tsx`):**
  - `Logo size="sm|md|lg" variant="full|mark" tone="auto|inverse"`;
  - `LogoMark`, que é só a casa;
  - `LogoLink`, que leva para a landing quem está deslogado e para a home do app quem está logado, e tem `aria-label`.
- **Tamanhos:**
  - `sm` (ícone 20 / texto 16): cabeçalho compacto;
  - `md` (28/20): NavBar e cabeçalho/rodapé da landing;
  - `lg` (36/28): topo das telas de autenticação e de fluxo isolado (Login, Cadastro, Esqueci/Redefinir senha, Confirmar e-mail deslogado, Onboarding).
- **Respiro mínimo:** metade da altura do ícone em volta, sem texto nem borda nesse espaço.
- **Tamanho mínimo:** ícone de 20 px na tela e 16 px no favicon.
- **Cores:** o "Ai" usa `brand` e as metades da casa usam `brand` e `coral-bright`. No tema escuro o componente troca sozinho; sobre fundo escuro fixo, use `tone="inverse"`.
- **Ícones:**
  - `public/favicon.svg` é a mesma geometria da `LogoMark` (viewBox 26) e tem versão escura por `prefers-color-scheme` dentro do SVG.
  - Os PNG do PWA e o `apple-touch-icon` saem de `public/pwa-icon.svg` com `node scripts/gen-icons.mjs`.
  - Nos ícones "maskable" a casa ocupa 50% do lado, dentro da zona segura; no apple-touch-icon, 60%.
- **Cor da barra do navegador:**
  - `index.html` tem duas metas `theme-color` com `media` (claro `#faf7f2`, escuro `#1a2228`).
  - O `ThemeContext` reescreve as duas com o `--color-paper` do tema escolhido à mão.
  - O manifest não aceita cor por tema, então fica a clara, igual ao splash.

## A4. Proibido (a checagem falha)

| Regra | O que pega | Em vez disso |
|---|---|---|
| `cor` | hex, `rgb()` ou `hsl()` fora de `src/index.css` | token `--color-*` (ou `--art-*`/`--device-*` em ilustração) |
| `style` | `style={{}}` com cor, espaço, tipografia, borda, sombra ou camada | classe com token. Largura e altura dinâmicas, `transform`, `opacity`, `animationDelay` e variáveis `--x` continuam permitidos |
| `paleta-crua` | `bg-gray-*`, `text-white`, `border-blue-500`… | token de cor |
| `arbitrario` | `text-[…]`, `leading-[…]`, `tracking-[…]`, `rounded-[…]`, `shadow-[…]`, `z-[…]`, `font-[…]`, `bg-[#…]` | nível da escala |
| `serif` | `font-serif` | nada: tudo é sans |
| `css-*` | no CSS fora do `index.css`: `font-size`, `font-family`, `z-index` (além de -1/0/1/auto) e `border-radius` em px sem `var()` | `var(--text-*)`, `var(--font-*)`, `var(--z-*)`, `var(--radius-*)` |

Além da checagem, por convenção:
- **Escala de texto:** use a escala nomeada e não a do Tailwind (`text-sm`, `text-lg`…). Hoje o código não tem nenhuma.
- **Medidas fora da escala:** `h-[NNpx]` e semelhantes só quando não houver valor na escala.

**Exceção pontual:** comentário `design-ok: motivo` na mesma linha, registrado aqui. Hoje não há nenhuma.

## A5. Números da migração

- **Checagem:** 236 violações → **0**.
- **oxlint:** os mesmos 16 avisos antigos, nenhum novo.
- **Bundle (gzip, mesmo build e mesmo `gzip` nas duas pontas):**

| | antes (`84f5b97`) | depois | variação |
|---|---|---|---|
| JS principal | 218.615 | 219.684 | +0,5% |
| CSS | 22.222 | 24.333 | +9,5% |
| **Total JS + CSS** | 560.514 | 563.693 | **+0,6%** (limite: 5%) |

O CSS cresceu 2,1 kB. Os motivos são os tokens do tema escuro, o par de `@font-face` de fallback (que evita o pulo de layout), os tokens de ilustração e as classes dos primitivos. O JS quase não mudou: os primitivos substituíram classes repetidas tela a tela.

---

# Parte B — Auditoria (Etapa 1, antes da migração)

> **Etapa 1: auditoria** (estado de 05/10/2026, antes de qualquer mudança). O guia em vigor é a Parte A, acima.
>
> - Números gerados por `frontend/scripts/audit-design.py`; a saída bruta, com arquivo:linha de cada achado, está em [design-audit-raw.txt](design-audit-raw.txt).
> - Capturas "antes" de 18 telas em 390/1440, claro/escuro: [capturas/design-system/antes/](capturas/design-system/antes/).
> - Bundle "antes" (gzip): JS principal 217,7 kB, CSS 22,1 kB ([bundle-antes.txt](bundle-antes.txt)).

## 1. Tokens do `@theme` (`frontend/src/index.css`)

O `@theme` tem só cores, 2 famílias, 3 raios e 1 sombra. Não há escala de tipografia, espaçamento, z-index, duração nem easing.

| Grupo | Tokens | Situação |
|---|---|---|
| **Superfícies** | `paper` (21 usos), `surface` (108), `surface-sunk` (60) | ok, os dois temas definidos |
| **Bordas** | `line` (92), `line-strong` (73) | `line-strong` também é borda de input e não chega a 3:1 (ver §5) |
| **Texto** | `ink` (264), `ink-2` (131), `ink-3` (208) | `ink-3` sobre `surface-sunk` fica abaixo do AA |
| **Marca** | `brand` (99), `brand-strong` (59), `brand-tint` (21), `on-brand` (36) | ok |
| **Coral** | `coral` (8), `coral-strong` (1), `coral-bright` (2), `coral-tint` (3) | **pouco uso; coral como texto e o botão coral falham no AA** |
| **Estados** | `leaf` (35), `leaf-tint` (9), `mel` (18), `mel-tint` (9), `danger` (66), `danger-tint` (38), `star` (5) | `leaf` e `mel` como texto falham no AA no tema claro |
| **Inverso / scrim / foco** | `inverse` (34), `on-inverse` (26), `scrim` (9), `focus` (22) | `focus` sobre `paper` = 2,93:1 (mínimo 3:1) |
| **Fontes** | `font-sans` (3), `font-serif` (21) | duas identidades de título (ver §4) |
| **Raios** | `radius-sm` 6 px (16), `radius-md` 10 px (159), `radius-lg` 14 px (55) | a landing usa 16 / 22 / 999 px no CSS, fora do `@theme` |
| **Sombras** | `shadow-pop` (13) | a landing tem `--card-shadow` / `--card-shadow-hover` próprios em `home.css` |

**Duplicados por valor** (são intencionais, mas sem relação semântica declarada):
- `paper` = `on-inverse` (`#faf7f2`);
- `surface` = `on-brand` (`#fff`);
- `ink` = `inverse` (`#1b2b33`).

**Sem uso:** nenhum token de cor está zerado. `coral-strong` (1 uso) e `coral-bright` (2: logo e 3D) são quase órfãos.

**Tokens fora do `@theme`** (fonte de verdade paralela):
- `home.css`: `--card-radius`, `--card-shadow`, `--card-shadow-hover`, `--accent` e `--ease-out`;
- `phone.css`: as cores fixas do objeto 3D.

## 2. Valores soltos

| O quê | Quantidade | Onde mais aparece |
|---|---|---|
| **Cor hex fora do `index.css`** | 50 | `phone.css` (40: corpo do celular 3D, intencionalmente fixo), `home.css` (10: gradientes das miniaturas da demo) |
| **`rgb()`/`rgba()` fora do `index.css`** | 33 | sombras em `home.css` (15) e `phone.css` (18) |
| **`style={{…}}`** | 12 em 7 arquivos | ver tabela abaixo |
| **Valor arbitrário do Tailwind `x-[…]`** | 249 | `text-[13px]` 106, `h-[42px]` 31, `h-[34px]` 19, `w/h-[18px]` 20, `text-[16px]` 7, `text-[28px]` 7, `z-[1000]` 6… |
| **…por arquivo** | — | BrowsePage 30, AdminPage 27, ListingPage 24, ProfilePage 23, UserPublicProfilePage 13, ConviviosSection 12 |
| **Classe de paleta crua (`bg-gray-*`…)** | 0 | — |
| **`font-size` no CSS** | 53 | 21 valores distintos (9,5 → 52 px, mais 3 `clamp`) |
| **`border-radius` no CSS** | 67 | 20 valores distintos (2, 3, 4, 6, 9, 10, 11, 12, 13, 14, 16, 18, 21, 22, 35, 44, 50%, 999…) |
| **`box-shadow` no CSS** | 22 | 21 declarações diferentes |
| **Durações** | 118 | 40 valores distintos (0,12 s … 5 s; 150/180/200/250/300 ms) |
| **z-index** | 24 | `z-[1000]` (6 modais), 10, 20, 30, e no CSS -2, -1, 1, 3, 4, 5, 30, 31, 50 |

Os `style={{…}}`:

| Arquivo:linha | Para quê |
|---|---|
| `components/Avatar.tsx:23, 35` | tamanho do avatar (prop numérica) |
| `components/BottomNav.tsx:21` | `safe-area-inset-bottom` (legítimo) |
| `components/CompatScore.tsx:49` | `fontSize: 28` (deveria ser token) |
| `components/ListingMapPreview.tsx:22`, `LocationPicker.tsx:38` | altura do mapa Leaflet |
| `pages/landing/phone/Phone3D.tsx:95–96` | posição dos botões laterais do celular 3D |
| `pages/landing/Bento.tsx` | variável `--i` para escalonar animações (legítimo) |

## 3. Variações do mesmo componente

| Componente | Ocorrências | Variações | Observações (arquivo:linha na saída bruta, §3) |
|---|---|---|---|
| **Botão** (`<button>` + `<Link>` com cara de botão) | 42 | **24** | alturas 34 / 36 (h-9) / 42 / 44 (h-11) / 46 / 50 px; padding 3 / 4 / 5 / 6; com e sem `text-sm`; "perigo" com `bg-danger text-on-inverse`, outro só com borda `danger`; AdminPage com `buttonClass` próprio de 34 px e 13 px |
| **Input / select / textarea** | ~60 | **7 `inputClass` diferentes** | `h-11` (Register, Onboarding), `py-2.5` (Profile, Listing, DeleteAccount), `py-2 text-sm` (Admin, UserPublicProfile); todos com a borda `line-strong` (2,17:1) |
| **Cartão** (surface + borda + raio) | 66 | **17** | padding 2 / 3 / 4 / 5 / 6 / 8; raio `lg` (14 px) no app e 22 px na landing; sombra só na landing |
| **Modal** (`fixed inset-0`) | 6 | 1 base repetida 6 × | mesma marcação copiada em LegalTerms, MarkUnavailable, PhotoLightbox, PickLocation, ReportUser e SafetyTerms; `z-[1000]` |
| **Chip / pílula de escolha** | ~40 | 5 | ChipPicker, BoolToggle, QuantityPicker, os "pressed" do Onboarding / Profile / Listing e os chips da landing (`habit-chip`, `demo-tag`) |
| **Badge** | ~15 | 4 | tags de tipo de anúncio, status de pagamento, contador de notificação, "combina mais" |
| **Toggle / checkbox** | 15 | 4 | `BoolToggle` (sim/não), checkbox nativo (Login, Register, modais), `aria-pressed` em botões, switch do modo da landing |
| **Aviso / banner** | 43 | 4 cores × várias formas | `danger-tint` 33 ×, `mel-tint` 4, `brand-tint` 5, `leaf-tint` 3; padding e raio variam; nenhum tem ícone padronizado |
| **Estado vazio** | 9 | 4 | `<p>` solto (Admin, NotificationBell), cartão com texto centralizado (Admin, Conversations), texto com link (Payments), item de lista (Convivios) |
| **Carregando** | 18 | 2 | texto "Carregando…" em 13 telas; sem skeleton (só um `animate-pulse` na landing) |

## 4. Tipografia: fonte e tamanho de título, por tela

**Duas identidades de título:**
- **Fraunces** (serifada, `font-serif font-medium`): **20 usos em 15 arquivos**, em todo h1 de tela do app.
- **Schibsted Grotesk pesada** (800, tracking negativo): na landing e no `Logo`.

| Tela | h1 hoje |
|---|---|
| Browse, Conversas, Meus anúncios, Pagamentos, Perfil, Admin | Fraunces 28 px, 500 |
| Esqueci senha, Redefinir senha, Onboarding, Detalhe do anúncio, Perfil público, Registro (passo 3) | Fraunces 24 px (`text-2xl`), 500 |
| Confirmar e-mail, Retorno do pagamento (5 estados) | Fraunces 20 px (`text-xl`), 500 |
| Termos / Privacidade (`LegalLayout`) | Fraunces 32 px, 500 |
| Login, Registro (passos 1 e 2) | `Logo` (Schibsted 800) |
| Landing (topo) | Schibsted 800, `clamp(42 px, 6,4 vw, 76 px)` |
| Landing (seções) | `.landing-h2`: Schibsted 800, `clamp(32, 4,2 vw, 48 px)`, tracking −0,035 em |

**h2 / h3 no app:** sans bold em 15 / 16 / 18 / 20 px (`text-[15px]`, `text-[16px]`, `text-lg`, `text-xl`), sem regra.

**Tamanhos de texto no TSX:** `text-sm` 184, `text-[13px]` **106**, `text-xs` 45, `text-xl` 16, `text-2xl` 10, `text-lg` 9, `text-[16px]` 7, `text-[28px]` 7, `text-[11px]` 5, `text-[15px]` 4, mais `text-[10px]`, `text-[14px]` e `text-[32px]`.

**Mono:** só `ui-monospace…` escrito direto no `home.css` (CPF mascarado). Não há token.

**Carregamento de fonte:**
- o `@import` do Google Fonts tem `display=swap` ✓;
- carrega Schibsted **400–900 (6 pesos)** e Fraunces (4 estilos);
- pesos usados de fato: 400, 500, 600, 700 e 800. O **900 não é usado**, e o Fraunces sai inteiro se os títulos migrarem.

## 5. Tema escuro e contraste (AA)

Razões de contraste calculadas a partir dos tokens (texto: mínimo 4,5; borda de componente e anel de foco: mínimo 3):

| Par | Claro | Escuro | Onde aparece |
|---|---|---|---|
| `ink-3` / `surface-sunk` | **4,24 ✗** | 5,91 | texto secundário em cartões "afundados" |
| `coral` / `paper` | **4,16 ✗** | 6,65 | palavra em coral no topo da landing, kicker coral |
| `on-brand` / `coral` | **4,44 ✗** | 7,29 | botões coral da landing (Tenho vaga, Anunciar grátis) |
| `leaf` / `surface` | **4,27 ✗** | 7,35 | "92%", "combina mais", textos de sucesso |
| `leaf` / `leaf-tint` | **3,74 ✗** | 6,80 | aviso de sucesso, chips de hábito em comum |
| `mel` / `mel-tint` | **4,13 ✗** | 7,62 | aviso de confirmação de e-mail, pagamento pendente |
| `line-strong` / `surface` (borda de input) | **2,17 ✗** | **2,62 ✗** | todos os inputs |
| `focus` / `paper` | **2,93 ✗** | 6,79 | anel de foco |
| demais pares (ink, ink-2, brand, danger, inverse…) | ≥ 4,58 ✓ | ≥ 5,70 ✓ | — |

**Outros problemas de tema escuro:**
- `<meta name="theme-color">` e o `theme_color` do manifest são fixos em `#faf7f2`: no escuro a barra do navegador/PWA fica creme.
- As sombras do app (`shadow-pop`) têm versão escura. As da landing também (`--card-shadow`), mas as sombras soltas em `home.css` (botões, demo-card) usam `rgba(27,43,51,…)` nos dois temas.
- O celular 3D usa cores fixas por design (o objeto é o mesmo nos dois temas), com override para o escuro em `phone.css`. Fica fora da regra de tokens e é documentado como exceção.

## 6. Logo

| Onde | Tamanho | Observação |
|---|---|---|
| `NavBar` (app logado) | `text-xl` (padrão) | ✓ leva para `/` |
| Header da landing | `text-lg` | ✓ |
| Rodapé da landing | `text-lg` | ✓ |
| Login, Registro (2 telas) | `text-2xl` | ✓ (padronizado no pedido anterior) |
| **Esqueci senha, Redefinir senha, Confirmar e-mail, Onboarding, Retorno do pagamento** | — | **✗ sem logo** |

- O `Logo` recebe `className` livre: tamanho e cor são decididos em cada lugar e não existe variante para fundo escuro.
- **Ícones do PWA e favicon × `LogoMark`:** o desenho não bate. O favicon, o `pwa-icon.svg` e os PNGs (192, 512, apple-touch) têm a casa mais larga e mais baixa: metade com 20,6 × 39,8 no grid de 64, proporção 0,52, telhado caindo 43% da altura. O `LogoMark` é mais estreito e alto: 9,2 × 20 no grid de 26, proporção 0,46, telhado caindo 37%. As cores batem (`#1e5f7a` / `#e8704a`). Comparação em `capturas/design-system/antes/` (icons).
- `public/icons.svg` é sobra do template do Vite (ícones de redes sociais) e não é usado.

## 7. Landing × app

| Aspecto | Landing | App |
|---|---|---|
| **Título** | Schibsted 800, tracking −0,035 em, 32–76 px | Fraunces 500, 20–32 px |
| **Raio de cartão** | 22 px (`--card-radius`) | 14 px (`rounded-lg`); cartões internos 10 px |
| **Sombra de cartão** | em repouso + hover (2 níveis) | nenhuma; `shadow-pop` só em popover/modal |
| **Padding de cartão** | 18–32 px | 12 / 16 / 20 / 24 / 32 px (5 valores) |
| **Botão** | 50 px, raio 14, peso 700, ícone com seta, sobe 2 px no hover | 34–46 px, raio 10, peso 600, sem hover de movimento |
| **Kicker** | `.landing-kicker` 12 px, 800, caixa alta, traço colorido | inexistente |
| **Animação** | entrada `.reveal`, loops, `prefers-reduced-motion` tratado | quase nenhuma (`transition` solta) |

## 8. Priorização

Ordem: **quanto aparece × quanto destoa** (A = alto, M = médio, B = baixo).

| # | Problema | Aparece | Destoa | Prioridade |
|---|---|---|---|---|
| 1 | Títulos em Fraunces no app × Schibsted pesada na landing | A (todas as telas) | A | **1** |
| 2 | Botões: 24 variações (6 alturas, 4 paddings) | A | A | **1** |
| 3 | Contraste AA: coral, leaf, mel, `ink-3`/sunk, borda de input, foco | A | A (acessibilidade) | **1** |
| 4 | Cartões: 17 variações; raio 14 × 22; sem sombra no app | A | A | **2** |
| 5 | Inputs: 7 `inputClass` | A | M | **2** |
| 6 | `text-[13px]` (106) e outros tamanhos soltos | A | M | **2** |
| 7 | Avisos/banners ad hoc (43) | M | M | **3** |
| 8 | Modal copiado 6 × (`z-[1000]`) | M | M | **3** |
| 9 | Logo ausente em 5 telas; `Logo` sem variantes; ícones do PWA diferentes do `LogoMark`; `theme-color` fixo | M | M | **3** |
| 10 | Estados vazios (4 formas) e "Carregando…" sem skeleton | M | M | **4** |
| 11 | Chips / toggles em 5 implementações | M | B | **4** |
| 12 | z-index e durações soltos | B | B | **5** |
| 13 | `style={{}}` e hex fora do tema (exceções do 3D e do mapa) | B | B | **5** |
