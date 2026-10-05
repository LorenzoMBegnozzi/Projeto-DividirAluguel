import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Heart, Inbox, Plus, Trash2 } from 'lucide-react'
import Logo from '../components/Logo'
import {
  Alert, Badge, Button, ButtonLink, Card, Checkbox, Chip, EmptyState, Input, Modal, Select, Skeleton, Textarea, Toggle,
  kickerClass, pageTitleClass,
} from '../components/ui'

// Galeria dos primitivos (só em desenvolvimento: a rota /dev/ui não entra no build de produção).
// Mostra tudo nos dois temas lado a lado. Guia: docs/10-DESIGN-SYSTEM.md

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className={kickerClass}>{title}</p>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  )
}

function Gallery() {
  const [chips, setChips] = useState<string[]>(['Não fuma'])
  const [on, setOn] = useState(true)
  const [modal, setModal] = useState(false)
  return (
    <div className="space-y-8">
      <Section title="logo">
        <Logo size="sm" /><Logo size="md" /><Logo size="lg" /><Logo variant="mark" size="lg" />
        <span className="rounded-md bg-inverse p-2"><Logo size="md" tone="inverse" /></span>
      </Section>
      <Section title="tipografia">
        <div className="w-full space-y-1">
          <p className="text-display text-ink">Display</p>
          <h1 className={pageTitleClass}>Título de tela (h1)</h1>
          <h2 className="text-h2 text-ink">Título de seção (h2)</h2>
          <h3 className="text-h3 text-ink">Título de cartão (h3)</h3>
          <p className="text-body text-ink-2">Texto corrido (body) com <a className="font-semibold text-brand underline" href="#x">link</a>.</p>
          <p className="text-small text-ink-2">Texto de apoio (small)</p>
          <p className="text-caption text-ink-3">Legenda / metadado (caption)</p>
          <p className={kickerClass}>Kicker (label)</p>
          <p className="font-mono text-small text-ink-2">•••.•••.•••-12 (mono)</p>
        </div>
      </Section>
      <Section title="botões">
        <Button>Primária</Button>
        <Button variant="secondary">Secundária</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger" icon={Trash2}>Perigo</Button>
        <Button variant="accent" iconRight={ArrowRight}>Destaque</Button>
        <Button variant="inverse">Inverso</Button>
      </Section>
      <Section title="tamanhos e estados">
        <Button size="sm">Pequeno</Button><Button size="md">Médio</Button><Button size="lg">Grande</Button>
        <Button loading>Salvando</Button><Button disabled>Desabilitado</Button>
        <Button icon={Plus} aria-label="Adicionar" /><Button variant="secondary" size="sm" icon={Heart} aria-label="Favoritar" />
        <ButtonLink to="/dev/ui" variant="secondary">Link com cara de botão</ButtonLink>
      </Section>
      <Section title="campos">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Input label="E-mail" placeholder="voce@email.com" hint="A gente nunca mostra seu e-mail." />
          <Input label="Senha" type="password" error="A senha precisa ter pelo menos 8 caracteres." defaultValue="123" />
          <Select label="Bairro" defaultValue="z7"><option value="z7">Zona 7</option><option value="c">Centro</option></Select>
          <Input label="Desabilitado" disabled defaultValue="não editável" />
          <Textarea label="Sobre você" placeholder="Conte um pouco da sua rotina" wrapperClassName="sm:col-span-2" />
          <Checkbox label="Manter conectado" defaultChecked />
          <Toggle label="Aceita pets" hint="Mostra só vagas que aceitam" checked={on} onChange={setOn} />
        </div>
      </Section>
      <Section title="chips e badges">
        {['Não fuma', 'Tem pet', 'Dorme cedo'].map((c) => (
          <Chip key={c} pressed={chips.includes(c)} showCheck onClick={() => setChips((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>{c}</Chip>
        ))}
        <Badge>Neutro</Badge><Badge tone="brand">Tem vaga</Badge><Badge tone="success">Pago</Badge><Badge tone="warning">Pendente</Badge>
        <Badge tone="danger">Cancelado</Badge><Badge tone="accent" shape="pill">Destaque</Badge><Badge tone="inverse" shape="pill">3</Badge>
      </Section>
      <Section title="cartões">
        <Card className="w-64"><p className="text-h3 text-ink">Cartão</p><p className="text-small text-ink-3">padding md, sombra sm</p></Card>
        <Card className="w-64" interactive><p className="text-h3 text-ink">Clicável</p><p className="text-small text-ink-3">sobe no hover</p></Card>
        <Card className="w-64" tone="sunk" padding="sm"><p className="text-small text-ink-2">Painel interno (sunk)</p></Card>
      </Section>
      <Section title="avisos">
        <div className="grid w-full gap-2">
          <Alert tone="info">Informação neutra.</Alert>
          <Alert tone="success" title="Pronto!">Seu anúncio foi publicado.</Alert>
          <Alert tone="warning" action={<Button size="sm" variant="secondary">Reenviar</Button>}>Confirme seu e-mail.</Alert>
          <Alert tone="danger">Não foi possível salvar.</Alert>
        </div>
      </Section>
      <Section title="vazio e carregando">
        <EmptyState icon={Inbox} title="Nenhuma conversa ainda." className="w-full sm:w-80" action={<ButtonLink to="/dev/ui" size="sm">Buscar vagas</ButtonLink>}>
          Quando você chamar alguém, a conversa aparece aqui.
        </EmptyState>
        <div className="w-64 space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-56" /><Skeleton className="h-24 w-full rounded-lg" /></div>
      </Section>
      <Section title="modal">
        <Button variant="secondary" onClick={() => setModal(true)}>Abrir modal</Button>
        {modal && (
          <Modal title="Título do modal" description="Texto curto explicando a ação." onEscape={() => setModal(false)}>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => setModal(false)}>Confirmar</Button></div>
          </Modal>
        )}
      </Section>
    </div>
  )
}

export default function DevUiPage() {
  // a página usa o tema claro na raiz e um trecho escuro ao lado (data-theme no trecho)
  useEffect(() => {
    const root = document.documentElement
    const prev = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'light')
    return () => { if (prev) root.setAttribute('data-theme', prev) }
  }, [])
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-paper p-6 sm:p-10" data-theme="light"><h1 className={`${pageTitleClass} mb-8`}>Claro</h1><Gallery /></div>
      <div className="bg-paper p-6 text-ink sm:p-10" data-theme="dark"><h1 className={`${pageTitleClass} mb-8`}>Escuro</h1><Gallery /></div>
    </div>
  )
}
