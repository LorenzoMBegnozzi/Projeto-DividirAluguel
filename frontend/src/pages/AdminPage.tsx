import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Flag, Home, LayoutDashboard, Receipt, RotateCcw, Search, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  blockAdminUser,
  closeAdminReport,
  deactivateAdminListing,
  getAdminListings,
  getAdminPayments,
  getAdminReports,
  getAdminSummary,
  getAdminUsers,
  reportReasonLabels,
  refundAdminPayment,
  reportStatusLabels,
  unblockAdminUser,
} from '../api/admin'
import type { AdminListing, AdminPayment, AdminReport, AdminSummary, AdminUser, ReportStatus } from '../api/admin'
import { paymentMethodLabels } from '../api/billing'
import type { PaymentStatus } from '../types'
import { apiErrorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../utils/format'

type Tab = 'RESUMO' | 'DENUNCIAS' | 'USUARIOS' | 'ANUNCIOS' | 'PAGAMENTOS'

const TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
  { value: 'RESUMO', label: 'Resumo', icon: LayoutDashboard },
  { value: 'DENUNCIAS', label: 'Denúncias', icon: Flag },
  { value: 'USUARIOS', label: 'Usuários', icon: Users },
  { value: 'ANUNCIOS', label: 'Anúncios', icon: Home },
  { value: 'PAGAMENTOS', label: 'Pagamentos', icon: Receipt },
]

const inputClass =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'
const buttonClass =
  'inline-flex h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition disabled:opacity-60'
const neutralButton = `${buttonClass} border-line-strong text-ink-2 hover:border-ink hover:text-ink`
const dangerButton = `${buttonClass} border-danger bg-danger text-on-inverse hover:opacity-90`

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('RESUMO')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-[28px] font-extrabold tracking-tight text-ink">
        <ShieldCheck className="h-7 w-7 text-brand" aria-hidden="true" />
        Administração
      </h1>
      <p className="mb-6 text-sm text-ink-3">Moderação de denúncias, contas e anúncios. Toda ação fica registrada no log.</p>

      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px flex h-[42px] shrink-0 items-center gap-1.5 border-b-[3px] px-3 text-sm font-semibold transition ${
              tab === value ? 'border-brand text-ink' : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'RESUMO' && <SummaryTab onOpen={setTab} />}
      {tab === 'DENUNCIAS' && <ReportsTab />}
      {tab === 'USUARIOS' && <UsersTab />}
      {tab === 'ANUNCIOS' && <ListingsTab />}
      {tab === 'PAGAMENTOS' && <PaymentsTab />}
    </div>
  )
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mb-4 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{message}</p>
}

function Badge({ tone, children }: { tone: 'danger' | 'brand' | 'leaf' | 'neutral'; children: ReactNode }) {
  const tones = {
    danger: 'bg-danger-tint text-danger',
    brand: 'bg-brand-tint text-brand-strong',
    leaf: 'bg-leaf-tint text-leaf',
    neutral: 'bg-surface-sunk text-ink-2',
  }
  return <span className={`inline-flex h-6 items-center rounded-sm px-2 text-xs font-bold ${tones[tone]}`}>{children}</span>
}

// ------------------------------------------------------------------ Resumo

function SummaryTab({ onOpen }: { onOpen: (tab: Tab) => void }) {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminSummary()
      .then(setSummary)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar o resumo')))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!summary) return <p className="text-ink-3">Carregando…</p>

  const tiles: { label: string; value: number; tab?: Tab; highlight?: boolean }[] = [
    { label: 'Denúncias abertas', value: summary.openReports, tab: 'DENUNCIAS', highlight: summary.openReports > 0 },
    { label: 'Usuários', value: summary.totalUsers, tab: 'USUARIOS' },
    { label: 'Contas bloqueadas', value: summary.blockedUsers, tab: 'USUARIOS' },
    { label: 'Anúncios ativos', value: summary.activeListings, tab: 'ANUNCIOS' },
    { label: 'Pagamentos pagos', value: summary.paidPayments, tab: 'PAGAMENTOS' },
    { label: 'Pagamentos pendentes', value: summary.pendingPayments, tab: 'PAGAMENTOS' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => {
        const content = (
          <>
            <p className={`text-[32px] font-extrabold tabular-nums leading-none ${tile.highlight ? 'text-danger' : 'text-ink'}`}>
              {tile.value}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-ink-3">{tile.label}</p>
          </>
        )
        return tile.tab ? (
          <button
            key={tile.label}
            onClick={() => onOpen(tile.tab!)}
            className="rounded-lg border border-line bg-surface p-4 text-left transition hover:border-ink-2"
          >
            {content}
          </button>
        ) : (
          <div key={tile.label} className="rounded-lg border border-line bg-surface p-4">
            {content}
          </div>
        )
      })}
    </div>
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
            className={`h-[34px] rounded-sm border px-3 text-[13px] font-semibold transition ${
              status === f.value ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong bg-surface text-ink-2 hover:border-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorBox message={error} />
      {!reports ? (
        <p className="text-ink-3">Carregando…</p>
      ) : reports.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-ink-3">Nenhuma denúncia aqui.</p>
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
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={open ? 'danger' : report.status === 'RESOLVIDA' ? 'leaf' : 'neutral'}>{reportStatusLabels[report.status]}</Badge>
        <Badge tone="brand">{reportReasonLabels[report.reason]}</Badge>
        <span className="text-xs text-ink-3">
          #{report.id} · {formatDateTime(report.createdAt)}
        </span>
      </div>

      <p className="mb-2 text-sm text-ink-2">
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
      <p className="mb-2 text-[13px] text-ink-3">
        {report.reported.reportsReceived} denúncia(s) contra essa conta no total
        {report.conversationId && ` · feita a partir da conversa #${report.conversationId}`}
      </p>
      {report.description && <p className="mb-3 rounded-md bg-surface-sunk px-3 py-2 text-sm text-ink-2">“{report.description}”</p>}

      {open ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Nota da moderação (opcional)" className={inputClass} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => close('RESOLVIDA', true)} disabled={busy || report.reported.blocked} className={dangerButton}>
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              Bloquear conta e resolver
            </button>
            <button onClick={() => close('RESOLVIDA', false)} disabled={busy} className={neutralButton}>
              Resolver sem bloquear
            </button>
            <button onClick={() => close('DESCARTADA', false)} disabled={busy} className={neutralButton}>
              Descartar
            </button>
          </div>
          <ErrorBox message={error} />
        </div>
      ) : (
        <p className="border-t border-line pt-3 text-[13px] text-ink-3">
          {reportStatusLabels[report.status]} por {report.resolvedByName ?? '—'}
          {report.resolvedAt && ` em ${formatDateTime(report.resolvedAt)}`}
          {report.adminNote && ` · “${report.adminNote}”`}
        </p>
      )}
    </div>
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
      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={placeholder} className={inputClass} />
      <button type="submit" className={neutralButton}>
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        Buscar
      </button>
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
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-ink-3">Ninguém encontrado.</p>
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
    <div className="rounded-lg border border-line bg-surface p-3">
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
          <p className="truncate text-[13px] text-ink-3">
            {user.email} · desde {formatDateTime(user.createdAt)} · {[user.renter && 'procura', user.advertiser && 'anuncia'].filter(Boolean).join(' e ')} ·{' '}
            {user.activeListings} anúncio(s) ativo(s)
          </p>
          {user.blocked && user.blockReason && <p className="mt-1 text-[13px] text-danger">Motivo: {user.blockReason}</p>}
        </div>
        {!user.admin &&
          (user.blocked ? (
            <button onClick={() => run(() => unblockAdminUser(user.id))} disabled={busy} className={neutralButton}>
              Desbloquear
            </button>
          ) : (
            !blocking && (
              <button onClick={() => setBlocking(true)} className={neutralButton}>
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                Bloquear
              </button>
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
            className={inputClass}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !reason.trim()} className={dangerButton}>
              Confirmar bloqueio
            </button>
            <button type="button" onClick={() => setBlocking(false)} className={neutralButton}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      <ErrorBox message={error} />
    </div>
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
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-ink-3">Nenhum anúncio encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <div key={listing.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3">
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
                <p className="text-[13px] text-ink-3">
                  de{' '}
                  <Link to={`/usuarios/${listing.ownerId}`} className="hover:text-brand">
                    {listing.ownerName}
                  </Link>
                  {listing.ownerBlocked && ' (conta bloqueada)'} · {formatDateTime(listing.createdAt)}
                </p>
              </div>
              {listing.active && (
                <button onClick={() => deactivate(listing)} disabled={busyId === listing.id} className={neutralButton}>
                  Tirar do ar
                </button>
              )}
            </div>
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
            className={`h-[34px] rounded-sm border px-3 text-[13px] font-semibold transition ${
              status === f.value ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong bg-surface text-ink-2 hover:border-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ErrorBox message={error} />
      {!payments ? (
        <p className="text-ink-3">Carregando…</p>
      ) : payments.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-ink-3">Nenhum pagamento aqui.</p>
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

  const tone = payment.status === 'PAGO' ? 'leaf' : payment.status === 'PENDENTE' ? 'brand' : 'neutral'

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
            {payment.type === 'DESTAQUE' ? 'Destaque' : 'Anúncio extra'} · <span className="tabular-nums">{formatMoney(payment.amount)}</span>
            <Badge tone={tone}>{paymentStatusLabels[payment.status]}</Badge>
            {payment.status === 'PAGO' && payment.withinWithdrawalPeriod && <Badge tone="brand">no prazo de 7 dias</Badge>}
            {!payment.gateway && <Badge tone="neutral">simulado</Badge>}
          </p>
          <p className="truncate text-[13px] text-ink-3">
            #{payment.id} ·{' '}
            <Link to={`/usuarios/${payment.userId}`} className="hover:text-brand">
              {payment.userName}
            </Link>{' '}
            ({payment.userEmail})
            {payment.method && ` · ${paymentMethodLabels[payment.method] ?? payment.method}`}
            {payment.paidAt && ` · pago em ${formatDateTime(payment.paidAt)}`}
          </p>
          {payment.status === 'REEMBOLSADO' && (
            <p className="mt-1 text-[13px] text-ink-2">
              Reembolsado{payment.refundedAt && ` em ${formatDateTime(payment.refundedAt)}`}
              {payment.refundReason && ` · “${payment.refundReason}”`}
            </p>
          )}
        </div>
        {payment.status === 'PAGO' && !refunding && (
          <button onClick={() => setRefunding(true)} className={neutralButton}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reembolsar
          </button>
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
          <p className="text-[13px] text-ink-3">
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
              className={inputClass}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !reason.trim()} className={dangerButton}>
                {busy ? 'Reembolsando…' : 'Confirmar reembolso'}
              </button>
              <button type="button" onClick={() => setRefunding(false)} className={neutralButton}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}
      <ErrorBox message={error} />
    </div>
  )
}
