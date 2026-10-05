# Guia de migração para o design system (Etapa 3)

Regras: **mudança visual, não funcional**. Mesmos textos, rotas, validações, chamadas de API,
handlers, estados, `aria-*` e `role`. Se algo exigir mudar comportamento, **não mude**: anote
e pule.

Primitivos: `import { Button, ButtonLink, Input, Textarea, Select, Checkbox, Card, Modal, Chip, Badge, Toggle, Alert, EmptyState, Skeleton, cx, buttonClass, fieldClass, cardClass, chipClass, badgeClass, labelClass, hintClass, kickerClass, pageTitleClass } from '../components/ui'`
(ajuste o caminho). A API está em `frontend/src/components/ui/*.tsx` e as classes em
`components/ui/styles.ts`. A galeria fica em `/dev/ui` (`npm run dev`).

## De → para

| Hoje | Vira |
|---|---|
| h1 de tela: `font-serif text-[28px]/text-2xl/text-[32px] font-medium tracking-tight text-ink` | `className={pageTitleClass}` (= `text-h1 text-ink`), mantendo as margens |
| h1 dentro de cartão de autenticação/fluxo (`text-2xl`/`text-xl` serif) | `text-h2 text-ink` |
| h2 de seção/cartão (`text-[16px]`/`text-[15px]`/`text-lg`/`text-xl` + `font-bold`) | `text-h3 text-ink` (o peso e o tracking vêm do token) |
| título de modal (`text-xl font-bold`) | `<Modal title=…>` ou `text-h2 text-ink` |
| `text-[13px]` | `text-caption` |
| `text-xs` (12 px, metadado) | `text-caption`; rótulo em caixa alta → `text-label uppercase` (ou `kickerClass`) |
| `text-sm` | `text-small` |
| `text-[15px]`, `text-[16px]`, `text-base` | `text-body` |
| `text-[14px]` | `text-small` |
| `text-[11px]`, `text-[10px]` | `text-micro` (só selo/contador) |
| `text-lg`/`text-xl`/`text-2xl` fora de título | o nível da escala mais próximo (`text-h3`, `text-h2`) |
| `font-serif` | remover (tudo é sans) |
| `<button className="h-[42px] … bg-brand text-on-brand …">` | `<Button>` (md). `h-[34px]`/`h-9` → `size="sm"`; `h-[46px]`/`h-12`+ → `size="lg"`; `w-full` → `full` |
| botão com borda `border-line-strong` | `<Button variant="secondary">` |
| botão só texto/ícone (`hover:bg-surface-sunk`) | `<Button variant="ghost">` (só ícone: `icon={X} aria-label="…"`) |
| botão `bg-danger` | `<Button variant="danger">` |
| botão de perigo só com borda (`border-danger text-danger`) | `<Button variant="secondary" className="border-danger text-danger hover:border-danger">` |
| `<Link>` com cara de botão | `<ButtonLink to=… variant=…>` |
| `loading ? 'Salvando…' : 'Salvar'` no texto | pode manter o texto; se o texto não muda, use `loading` |
| `inputClass` local (`rounded-md border border-line-strong …`) | `<Input label=…>` quando houver `<label>` ao lado; se o layout não deixar, `className={fieldClass()}` no elemento atual |
| `<label className="… text-[13px] font-semibold …">` | `labelClass` |
| cartão `rounded-lg border border-line bg-surface p-6` | `<Card>` (padding md); `p-8` → `padding="lg"`; `p-3`/`p-4`/`p-5` → `padding="sm"`; troque a tag com `as="section"`/`as="li"` |
| painel interno `rounded-md … bg-surface-sunk …` | `<Card tone="sunk" padding="sm">` |
| aviso `rounded-md bg-danger-tint px-3 py-2 text-[13px] text-danger` | `<Alert tone="danger">` (mel-tint → `warning`, leaf-tint → `success`, brand-tint → `info`); **mantenha `role`/`aria-live` que já existiam** |
| `fixed inset-0 z-[1000] … bg-scrim` + painel | `<Modal title=… size=…>` (não passe `onEscape` se antes não fechava com Esc) |
| pílula com `aria-pressed` (escolha) | `<Chip pressed=… onClick=…>` |
| rótulo de status/tipo (pequeno, colorido, não clicável) | `<Badge tone=…>` |
| texto de vazio ("Nenhum…", "Você ainda…") em cartão/parágrafo | `<EmptyState title="(mesmo texto)">`; se houver texto explicativo, vai em children |
| `rounded-lg` em cartão | `rounded-xl` (já vem no `Card`); `rounded-lg` fica para painel interno; `rounded-md` continua para botão/campo/item |
| `shadow-pop` | `shadow-lg` |
| `z-[1000]` → `z-(--z-modal)`; `z-20` → `z-(--z-sticky)`; `z-30` → `z-(--z-dropdown)`; `z-10` → `z-(--z-raised)` | |
| `h-[42px]`→`h-11`, `h-[34px]`→`h-9`, `w/h-[18px]`→`size-4.5`, `h-[60px]`→`h-15`, `h-[32px]`→`h-8`, `h-[64px]`→`h-16`, `w-[96px]`→`w-24` | (sem valor arbitrário quando existir o da escala) |
| `rounded-[Npx]`, `tracking-[…]`, `leading-[…]`, `text-[…]`, `z-[…]`, `shadow-[…]` | **proibidos**: use o token |
| `style={{ fontSize/color/padding… }}` | classe com token |

## Conferir antes de entregar

1. `npx tsc --noEmit -p tsconfig.app.json` sem erro **nos seus arquivos**.
2. `node scripts/check-design.mjs` sem violação **nos seus arquivos**.
3. `npx oxlint <seus arquivos>`: sem aviso novo.
4. Nenhum texto visível, rota, handler ou chamada de API mudou (compare o diff).
5. Alvos de toque ≥ 44 px nas ações principais em 390 px (`Button` md já tem; `sm` ganha 44 px em tela de toque).
