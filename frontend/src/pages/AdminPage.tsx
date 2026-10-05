import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Flag,
  Home,
  LayoutDashboard,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  blockAdminUser,
  closeAdminReport,
  deactivateAdminListing,
  getAdminListings,
  getAdminPayments,
  getAdminReports,
  getAdminDashboard,
  getAdminUsers,
  reportReasonLabels,
  refundAdminPayment,
  reportStatusLabels,
  unblockAdminUser,
} from '../api/admin'
import type {
  AdminDashboard,
  AdminListing,
  AdminPayment,
  AdminReport,
  AdminUser,
  DashboardPeriod,
  ReportStatus,
} from '../api/admin'
import { paymentMethodLabels } from '../api/billing'
import type { PaymentStatus, PaymentType } from '../types'
import { apiErrorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../utils/format'
import { Alert, Badge, Button, Card, EmptyState, chipClass, cx, fieldClass, pageTitleClass } from '../components/ui'
import type { BadgeTone } from '../components/ui'

type Tab = 'RESUMO' | 'DENUNCIAS' | 'USUARIOS' | 'ANUNCIOS' | 'PAGAMENTOS'

const TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
  { value: 'RESUMO', label: 'Resumo', icon: LayoutDashboard },
  { value: 'DENUNCIAS', label: 'Denúncias', icon: Flag },
  { value: 'USUARIOS', label: 'Usuários', icon: Users },
  { value: 'ANUNCIOS', label: 'Anúncios', icon: Home },
  { value: 'PAGAMENTOS', label: 'Pagamentos', icon: Receipt },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('RESUMO')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className={cx(pageTitleClass, 'mb-1 flex items-center gap-2')}>
        <ShieldCheck className="size-7 text-brand" aria-hidden="true" />
        Administração
      </h1>
      <p className="mb-6 text-small text-ink-3">Visão geral, denúncias, contas, anúncios e pagamentos. Toda ação fica registrada no log.</p>

      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cx(
              '-mb-px flex h-11 shrink-0 items-center gap-1.5 border-b-3 px-3 text-small font-semibold transition-colors duration-(--dur-fast)',
              tab === value ? 'border-brand text-ink' : 'border-transparent text-ink-2 hover:text-ink',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'RESUMO' && <DashboardTab onOpen={setTab} />}
      {tab === 'DENUNCIAS' && <ReportsTab />}
      {tab === 'USUARIOS' && <UsersTab />}
      {tab === 'ANUNCIOS' && <ListingsTab />}
      {tab === 'PAGAMENTOS' && <PaymentsTab />}
    </div>
  )
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert tone="danger" className="mb-4">
      {message}
    </Alert>
  )
}

// ------------------------------------------------------------------ Resumo (dashboard)

const PERIODS: DashboardPeriod[] = [7, 30, 90]

const paymentTypeLabels: Record<PaymentType, string> = {
  DESTAQUE: 'Destaque',
  ANUNCIO_EXTRA: 'Anúncio extra',
}

function methodLabel(method: string) {
  if (method === 'simulado') return 'Simulado (teste)'
  return paymentMethodLabels[method] ?? method
}

function shortDate(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

function DashboardTab({ onOpen }: { onOpen: (tab: Tab) => void }) {
  const [days, setDays] = useState<DashboardPeriod>(30)
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    getAdminDashboard(days)
      .then((d) => {
        if (current) {
          setData(d)
          setError(null)
        }
      })
      .catch((err) => current && setError(apiErrorMessage(err, 'Não foi possível carregar o resumo')))
    return () => {
      current = false
    }
  }, [days])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-3">Números dos últimos {days} dias.</p>
        <div role="group" aria-label="Período" className="inline-flex rounded-md border border-field bg-surface p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={cx(
                'h-8 rounded-sm px-3 text-caption font-semibold transition-colors duration-(--dur-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                days === p ? 'bg-inverse text-on-inverse' : 'text-ink-2 hover:text-ink',
              )}
            >
              {p} dias
            </button>
          ))}
        </div>
      </div>

      <ErrorBox message={error} />
      {!data && !error && <p className="text-ink-3">Carregando…</p>}
      {data && (
        <>
          <KpiCards data={data} />
          <AttentionList data={data} onOpen={onOpen} />
          <div className="grid gap-5 md:grid-cols-2">
            <SignupsChart weeks={data.signupsByWeek} />
            <RevenueBreakdown data={data} />
          </div>
          <NeighborhoodsTable rows={data.topNeighborhoods} />
        </>
      )}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="section" padding="sm">
      <h2 className="mb-3 text-h3 text-ink">{title}</h2>
      {children}
    </Card>
  )
}

function KpiCards({ data }: { data: AdminDashboard }) {
  const k = data.kpis
  const change = k.newUsersPrevious > 0 ? Math.round(((k.newUsers - k.newUsersPrevious) / k.newUsersPrevious) * 100) : null
  const cards: { label: string; value: string; detail: ReactNode }[] = [
    {
      label: 'Novos cadastros',
      value: String(k.newUsers),
      detail:
        change !== null ? (
          <>
            <span className={`font-bold ${change >= 0 ? 'text-leaf' : 'text-danger'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>{' '}
            vs. {data.days} dias antes
          </>
        ) : (
          `${k.newRenters} procurando · ${k.newAdvertisers} anunciando`
        ),
    },
    {
      label: 'Usuários ativos',
      value: k.activeUsers === null ? '—' : String(k.activeUsers),
      detail: k.activeUsers === null ? 'sem registros de acesso' : `de ${k.totalUsers} contas`,
    },
    {
      label: 'Faturamento',
      value: formatMoney(k.revenue),
      detail: `${k.sales} ${k.sales === 1 ? 'venda' : 'vendas'} · ${k.refunds} ${k.refunds === 1 ? 'reembolso' : 'reembolsos'}`,
    },
    {
      label: 'Vagas fechadas',
      value: String(k.dealsClosed),
      detail: `${k.activeListings} anúncios no ar`,
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} padding="sm">
          <p className="text-caption font-semibold text-ink-3">{c.label}</p>
          <p className="mt-1 truncate text-h1 tabular-nums text-ink">{c.value}</p>
          <p className="mt-1 text-caption text-ink-3">{c.detail}</p>
        </Card>
      ))}
    </div>
  )
}

function AttentionList({ data, onOpen }: { data: AdminDashboard; onOpen: (tab: Tab) => void }) {
  const a = data.attention
  type Item = { count: number; text: string; tab: Tab; urgent: boolean }
  const all: Item[] = [
    { count: a.reportsOpenOver24h, text: 'denúncias abertas há mais de 24h', tab: 'DENUNCIAS', urgent: true },
    { count: a.usersWithManyOpenReports, text: 'contas com 2+ denúncias abertas (não bloqueadas)', tab: 'DENUNCIAS', urgent: true },
    { count: a.paymentsWithinWithdrawal, text: 'pagamentos no prazo de arrependimento (7 dias)', tab: 'PAGAMENTOS', urgent: false },
    { count: a.pendingPaymentsOver1Day, text: 'pagamentos pendentes há mais de 1 dia', tab: 'PAGAMENTOS', urgent: false },
    { count: a.unconfirmedEmails, text: 'contas sem e-mail confirmado', tab: 'USUARIOS', urgent: false },
  ]
  const items = all.filter((i) => i.count > 0)

  return (
    <Panel title="Precisa de atenção">
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-small text-leaf">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Tudo em dia.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.text}>
              <button
                onClick={() => onOpen(i.tab)}
                className="flex min-h-11 w-full items-center gap-3 py-2 text-left text-small text-ink-2 transition-colors duration-(--dur-fast) hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <AlertTriangle className={cx('size-4 shrink-0', i.urgent ? 'text-danger' : 'text-mel')} aria-hidden="true" />
                <span className="min-w-5 font-bold tabular-nums text-ink">{i.count}</span>
                <span className="flex-1">{i.text}</span>
                <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function SignupsChart({ weeks }: { weeks: AdminDashboard['signupsByWeek'] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const totals = weeks.map((w) => w.total)
  const max = Math.max(1, ...totals)
  const labelEvery = Math.ceil(weeks.length / 5)
  const active = hovered !== null ? weeks[hovered] : null

  return (
    <Panel title="Cadastros por semana">
      <p className="mb-2 h-4.5 text-caption text-ink-3" aria-live="polite">
        {active
          ? `Semana de ${shortDate(active.weekStart)}: ${active.total} (${active.renters} procurando, ${active.advertisers} anunciando)`
          : `Máximo: ${max} por semana`}
      </p>
      <div className="relative h-35 border-b border-line-strong" onMouseLeave={() => setHovered(null)}>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden="true" />
        <div className="absolute inset-0 flex items-end gap-0.5">
          {weeks.map((w, i) => (
            <button
              key={w.weekStart}
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              aria-label={`Semana de ${shortDate(w.weekStart)}: ${totals[i]} cadastros`}
              className="flex h-full flex-1 items-end outline-none"
            >
              <span
                className={cx(
                  'block w-full rounded-t-sm bg-brand transition-opacity duration-(--dur-fast)',
                  hovered === null || hovered === i ? '' : 'opacity-40',
                )}
                style={{ height: totals[i] === 0 ? 0 : `max(${(totals[i] / max) * 100}%, 3px)` }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1 flex gap-0.5 text-micro tabular-nums text-ink-3">
        {weeks.map((w, i) => (
          <span key={w.weekStart} className="flex-1 whitespace-nowrap">
            {i % labelEvery === 0 ? shortDate(w.weekStart) : ''}
          </span>
        ))}
      </div>
    </Panel>
  )
}

function RevenueBreakdown({ data }: { data: AdminDashboard }) {
  const max = Math.max(0.01, ...data.revenueByMethod.map((m) => m.amount))
  return (
    <Panel title="Faturamento por meio de pagamento">
      {data.revenueByMethod.length === 0 ? (
        <EmptyState title="Nenhuma venda no período." />
      ) : (
        <ul className="space-y-3">
          {data.revenueByMethod.map((m) => (
            <li key={m.method}>
              <div className="mb-1 flex justify-between gap-2 text-small">
                <span className="text-ink-2">{methodLabel(m.method)}</span>
                <span className="text-ink">
                  {formatMoney(m.amount)} <span className="text-ink-3">({m.count})</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-sunk">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${(m.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {data.revenueByType.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-1 text-caption font-semibold text-ink-3">Por produto</p>
          <ul className="space-y-1 text-small">
            {data.revenueByType.map((t) => (
              <li key={t.type} className="flex justify-between gap-2">
                <span className="text-ink-2">{paymentTypeLabels[t.type] ?? t.type}</span>
                <span className="text-ink">
                  {formatMoney(t.amount)} <span className="text-ink-3">({t.count})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function NeighborhoodsTable({ rows }: { rows: AdminDashboard['topNeighborhoods'] }) {
  return (
    <Panel title="Bairros com mais anúncios no ar">
      {rows.length === 0 ? (
        <EmptyState title="Nenhum anúncio com bairro informado." />
      ) : (
        <table className="w-full text-small">
          <thead>
            <tr className="text-left text-caption text-ink-3">
              <th className="pb-2 font-semibold">Bairro</th>
              <th className="pb-2 text-right font-semibold">Anúncios</th>
              <th className="pb-2 text-right font-semibold">Preço médio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="py-2 text-ink">{r.name}</td>
                <td className="py-2 text-right tabular-nums text-ink-2">{r.listings}</td>
                <td className="py-2 text-right text-ink-2">
                  {r.averagePrice === null ? '—' : formatMoney(r.averagePrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}

// ------------------------------------------------------------------ Denúncias

function ReportsTab() {
  const [status, setStatus] = useState<ReportStatus | null>('ABERTA')
  const [reports, setReports] = useState<AdminReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setReports(null)
    getAdminReports(status)
      .then(setReports)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar as denúncias')))
  }, [status])

  useEffect(load, [load])

  const filters: { value: ReportStatus | null; label: string }[] = [
    { value: 'ABERTA', label: 'Abertas' },
    { value: 'RESOLVIDA', label: 'Resolvidas' },
    { value: 'DESCARTADA', label: 'Descartadas' },
    { value: null, label: 'Todas' },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatus(f.value)}
            className={chipClass({ pressed: status === f.value })}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorBox message={error} />
      {!reports ? (
        <p className="text-ink-3">Carregando…</p>
      ) : reports.length === 0 ? (
        <EmptyState title="Nenhuma denúncia aqui." />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onChange={(updated) => setReports((prev) => prev?.map((r) => (r.id === updated.id ? updated : r)) ?? null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportCard({ report, onChange }: { report: AdminReport; onChange: (r: AdminReport) => void }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function close(status: 'RESOLVIDA' | 'DESCARTADA', blockReported: boolean) {
    if (blockReported && !window.confirm(`Bloquear a conta de ${report.reported.name}? Ela não vai conseguir entrar e os anúncios saem da busca.`)) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      onChange(await closeAdminReport(report.id, status, note, blockReported))
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível atualizar a denúncia'))
    } finally {
      setBusy(false)
    }
  }

  const open = report.status === 'ABERTA'

  return (
    <Card padding="sm">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={open ? 'danger' : report.status === 'RESOLVIDA' ? 'success' : 'neutral'}>{reportStatusLabels[report.status]}</Badge>
        <Badge tone="brand">{reportReasonLabels[report.reason]}</Badge>
        <span className="text-caption text-ink-3">
          #{report.id} · {formatDateTime(report.createdAt)}
        </span>
      </div>

      <p className="mb-2 text-small text-ink-2">
        <Link to={`/usuarios/${report.reporter.id}`} className="font-semibold text-ink hover:text-brand">
          {report.reporter.name}
        </Link>{' '}
        denunciou{' '}
        <Link to={`/usuarios/${report.reported.id}`} className="font-semibold text-ink hover:text-brand">
          {report.reported.name}
        </Link>
        <span className="text-ink-3"> ({report.reported.email})</span>
        {report.reported.blocked && (
          <span className="ml-1.5">
            <Badge tone="danger">bloqueada</Badge>
          </span>
        )}
      </p>
      <p className="mb-2 text-caption text-ink-3">
        {report.reported.reportsReceived} denúncia(s) contra essa conta no total
        {report.conversationId && ` · feita a partir da conversa #${report.conversationId}`}
      </p>
      {report.description && (
        <Card as="p" tone="sunk" padding="sm" className="mb-3 text-small text-ink-2">
          “{report.description}”
        </Card>
      )}

      {open ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Nota da moderação (opcional)" className={fieldClass()} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" icon={Ban} onClick={() => close('RESOLVIDA', true)} disabled={busy || report.reported.blocked}>
              Bloquear conta e resolver
            </Button>
            <Button size="sm" variant="secondary" onClick={() => close('RESOLVIDA', false)} disabled={busy}>
              Resolver sem bloquear
            </Button>
            <Button size="sm" variant="secondary" onClick={() => close('DESCARTADA', false)} disabled={busy}>
              Descartar
            </Button>
          </div>
          <ErrorBox message={error} />
        </div>
      ) : (
        <p className="border-t border-line pt-3 text-caption text-ink-3">
          {reportStatusLabels[report.status]} por {report.resolvedByName ?? '—'}
          {report.resolvedAt && ` em ${formatDateTime(report.resolvedAt)}`}
          {report.adminNote && ` · “${report.adminNote}”`}
        </p>
      )}
    </Card>
  )
}

// ------------------------------------------------------------------ Usuários

function SearchBar({ placeholder, onSearch }: { placeholder: string; onSearch: (term: string) => void }) {
  const [term, setTerm] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    onSearch(term)
  }
  return (
    <form onSubmit={submit} className="mb-4 flex gap-2">
      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={placeholder} className={fieldClass()} />
      <Button type="submit" variant="secondary" icon={Search} className="shrink-0">
        Buscar
      </Button>
    </form>
  )
}

function UsersTab() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUsers(null)
    getAdminUsers(search)
      .then(setUsers)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os usuários')))
  }, [search])

  return (
    <div>
      <SearchBar placeholder="Nome ou e-mail" onSearch={setSearch} />
      <ErrorBox message={error} />
      {!users ? (
        <p className="text-ink-3">Carregando…</p>
      ) : users.length === 0 ? (
        <EmptyState title="Ninguém encontrado." />
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <UserRow key={user.id} user={user} onChange={(u) => setUsers((prev) => prev?.map((x) => (x.id === u.id ? u : x)) ?? null)} />
          ))}
        </div>
      )}
    </div>
  )
}

function UserRow({ user, onChange }: { user: AdminUser; onChange: (u: AdminUser) => void }) {
  const [blocking, setBlocking] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<AdminUser>) {
    setBusy(true)
    setError(null)
    try {
      onChange(await action())
      setBlocking(false)
      setReason('')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível atualizar a conta'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
            <Link to={`/usuarios/${user.id}`} className="hover:text-brand">
              {user.name}
            </Link>
            {user.admin && <Badge tone="brand">admin</Badge>}
            {user.blocked && <Badge tone="danger">bloqueada</Badge>}
            {user.reportsReceived > 0 && <Badge tone="danger">{user.reportsReceived} denúncia(s)</Badge>}
          </p>
          <p className="truncate text-caption text-ink-3">
            {user.email} · desde {formatDateTime(user.createdAt)} · {[user.renter && 'procura', user.advertiser && 'anuncia'].filter(Boolean).join(' e ')} ·{' '}
            {user.activeListings} anúncio(s) ativo(s)
          </p>
          {user.blocked && user.blockReason && <p className="mt-1 text-caption text-danger">Motivo: {user.blockReason}</p>}
        </div>
        {!user.admin &&
          (user.blocked ? (
            <Button size="sm" variant="secondary" className="shrink-0" onClick={() => run(() => unblockAdminUser(user.id))} disabled={busy}>
              Desbloquear
            </Button>
          ) : (
            !blocking && (
              <Button size="sm" variant="secondary" icon={Ban} className="shrink-0" onClick={() => setBlocking(true)}>
                Bloquear
              </Button>
            )
          ))}
      </div>

      {blocking && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => blockAdminUser(user.id, reason))
          }}
          className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row"
        >
          <input
            required
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Motivo do bloqueio (obrigatório)"
            className={fieldClass()}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={busy || !reason.trim()}>
              Confirmar bloqueio
            </Button>
            <Button type="button" variant="secondary" onClick={() => setBlocking(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
      <ErrorBox message={error} />
    </Card>
  )
}

// ------------------------------------------------------------------ Anúncios

function ListingsTab() {
  const [search, setSearch] = useState('')
  const [listings, setListings] = useState<AdminListing[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    setListings(null)
    getAdminListings(search)
      .then(setListings)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os anúncios')))
  }, [search])

  async function deactivate(listing: AdminListing) {
    if (!window.confirm(`Tirar do ar o anúncio "${listing.title}"? O dono deixa de vê-lo em "Meus anúncios".`)) return
    setBusyId(listing.id)
    setError(null)
    try {
      const updated = await deactivateAdminListing(listing.id)
      setListings((prev) => prev?.map((l) => (l.id === updated.id ? updated : l)) ?? null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível tirar o anúncio do ar'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <SearchBar placeholder="Título do anúncio ou nome do dono" onSearch={setSearch} />
      <ErrorBox message={error} />
      {!listings ? (
        <p className="text-ink-3">Carregando…</p>
      ) : listings.length === 0 ? (
        <EmptyState title="Nenhum anúncio encontrado." />
      ) : (
        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <Card key={listing.id} padding="sm" className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
                  {listing.active ? (
                    <Link to={`/anuncios/${listing.id}`} className="hover:text-brand">
                      {listing.title}
                    </Link>
                  ) : (
                    <span className="text-ink-3 line-through">{listing.title}</span>
                  )}
                  <Badge tone="neutral">{listing.type === 'TEM_VAGA' ? 'Vaga' : 'Imóvel'}</Badge>
                  {!listing.active && <Badge tone="danger">fora do ar</Badge>}
                  {listing.active && !listing.available && <Badge tone="neutral">indisponível</Badge>}
                  {listing.highlighted && <Badge tone="brand">destaque</Badge>}
                </p>
                <p className="text-caption text-ink-3">
                  de{' '}
                  <Link to={`/usuarios/${listing.ownerId}`} className="hover:text-brand">
                    {listing.ownerName}
                  </Link>
                  {listing.ownerBlocked && ' (conta bloqueada)'} · {formatDateTime(listing.createdAt)}
                </p>
              </div>
              {listing.active && (
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => deactivate(listing)} disabled={busyId === listing.id}>
                  Tirar do ar
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Pagamentos

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
}

function PaymentsTab() {
  const [status, setStatus] = useState<PaymentStatus | null>('PAGO')
  const [payments, setPayments] = useState<AdminPayment[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPayments(null)
    getAdminPayments(status)
      .then(setPayments)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os pagamentos')))
  }, [status])

  const filters: { value: PaymentStatus | null; label: string }[] = [
    { value: 'PAGO', label: 'Pagos' },
    { value: 'REEMBOLSADO', label: 'Reembolsados' },
    { value: 'PENDENTE', label: 'Pendentes' },
    { value: null, label: 'Todos' },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatus(f.value)}
            className={chipClass({ pressed: status === f.value })}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ErrorBox message={error} />
      {!payments ? (
        <p className="text-ink-3">Carregando…</p>
      ) : payments.length === 0 ? (
        <EmptyState title="Nenhum pagamento aqui." />
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onChange={(p) => setPayments((prev) => prev?.map((x) => (x.id === p.id ? p : x)) ?? null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentRow({ payment, onChange }: { payment: AdminPayment; onChange: (p: AdminPayment) => void }) {
  const [refunding, setRefunding] = useState(false)
  const [reason, setReason] = useState(payment.withinWithdrawalPeriod ? 'Arrependimento em até 7 dias (CDC, art. 49)' : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refund() {
    const money = payment.gateway ? ` Os ${formatMoney(payment.amount)} voltam para ${payment.userName} pelo Mercado Pago.` : ''
    if (!window.confirm(`Reembolsar o pagamento #${payment.id}?${money} A compra é desfeita e não dá para voltar atrás.`)) return
    setBusy(true)
    setError(null)
    try {
      onChange(await refundAdminPayment(payment.id, reason))
      setRefunding(false)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível reembolsar'))
    } finally {
      setBusy(false)
    }
  }

  const tone: BadgeTone = payment.status === 'PAGO' ? 'success' : payment.status === 'PENDENTE' ? 'brand' : 'neutral'

  return (
    <Card padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
            {payment.type === 'DESTAQUE' ? 'Destaque' : 'Anúncio extra'} · <span className="tabular-nums">{formatMoney(payment.amount)}</span>
            <Badge tone={tone}>{paymentStatusLabels[payment.status]}</Badge>
            {payment.status === 'PAGO' && payment.withinWithdrawalPeriod && <Badge tone="brand">no prazo de 7 dias</Badge>}
            {!payment.gateway && <Badge tone="neutral">simulado</Badge>}
          </p>
          <p className="truncate text-caption text-ink-3">
            #{payment.id} ·{' '}
            <Link to={`/usuarios/${payment.userId}`} className="hover:text-brand">
              {payment.userName}
            </Link>{' '}
            ({payment.userEmail})
            {payment.method && ` · ${paymentMethodLabels[payment.method] ?? payment.method}`}
            {payment.paidAt && ` · pago em ${formatDateTime(payment.paidAt)}`}
          </p>
          {payment.status === 'REEMBOLSADO' && (
            <p className="mt-1 text-caption text-ink-2">
              Reembolsado{payment.refundedAt && ` em ${formatDateTime(payment.refundedAt)}`}
              {payment.refundReason && ` · “${payment.refundReason}”`}
            </p>
          )}
        </div>
        {payment.status === 'PAGO' && !refunding && (
          <Button size="sm" variant="secondary" icon={RotateCcw} className="shrink-0" onClick={() => setRefunding(true)}>
            Reembolsar
          </Button>
        )}
      </div>

      {refunding && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            refund()
          }}
          className="mt-3 flex flex-col gap-2 border-t border-line pt-3"
        >
          <p className="text-caption text-ink-3">
            {payment.type === 'DESTAQUE'
              ? 'O anúncio perde os dias de destaque deste pagamento.'
              : payment.listingId
                ? 'O crédito já foi usado: o anúncio publicado com ele sai do ar.'
                : 'O crédito de anúncio extra ainda não usado é retirado.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              required
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Motivo do reembolso (obrigatório)"
              className={fieldClass()}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" disabled={busy || !reason.trim()}>
                {busy ? 'Reembolsando…' : 'Confirmar reembolso'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setRefunding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      )}
      <ErrorBox message={error} />
    </Card>
  )
}
