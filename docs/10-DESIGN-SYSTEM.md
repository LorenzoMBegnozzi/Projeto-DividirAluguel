# 10 — Design system

> **Etapa 1: auditoria** (estado de 05/10/2026, antes de qualquer mudança). O guia final, com tokens e primitivos, fica na segunda parte deste documento, quando a migração terminar.
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
