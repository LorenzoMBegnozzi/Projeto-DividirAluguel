import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LogoLink } from '../components/Logo'
import LegalLinks from '../components/LegalLinks'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'
import type { AdvertiserKind, Role } from '../types'
import { Alert, Button, Card, Checkbox, Input, cx, focusRing } from '../components/ui'
import { formatCpf } from '../utils/format'
import { clearPendingGoogleSignup, readPendingGoogleSignup } from '../utils/googleSignup'

/** Opção grande clicável (marcada = borda e fundo da marca). */
function Choice({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: ReactNode; hint: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex-1 rounded-lg border p-3 text-left transition-colors duration-(--dur-fast)',
        selected ? 'border-brand bg-brand-tint' : 'border-field bg-surface hover:border-ink',
        focusRing,
      )}
    >
      <span className="block text-small font-semibold text-ink">{title}</span>
      <span className="block text-caption text-ink-3">{hint}</span>
    </button>
  )
}

/**
 * Tela obrigatória "falta pouco": primeira vez que a pessoa entra com o Google. O Google informa
 * nome e e-mail; o resto do cadastro (perfil, nascimento, CPF e o aceite dos termos) é pedido aqui.
 * A conta só é criada ao enviar; antes disso não há login, então não dá para pular esta tela.
 */
export default function CompleteGoogleSignupPage() {
  const { user, completeGoogleSignup } = useAuth()
  const navigate = useNavigate()
  const [pending] = useState(readPendingGoogleSignup)
  const [role, setRole] = useState<Role | null>(pending?.role ?? null)
  const [advertiserKind, setAdvertiserKind] = useState<AdvertiserKind | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [cpf, setCpf] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />
  if (!pending) return <Navigate to="/login" replace />

  const ready = !!role && (role === 'RENTER' || !!advertiserKind) && acceptTerms

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pending || !role) return
    setError(null)
    setLoading(true)
    try {
      await completeGoogleSignup({
        signupToken: pending.signupToken,
        birthDate,
        cpf: cpf.replace(/\D/g, ''),
        role,
        advertiserKind: role === 'ADVERTISER' ? advertiserKind : null,
        acceptTerms,
      })
      navigate(role === 'RENTER' ? '/onboarding' : '/perfil')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível criar a conta'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      <LogoLink size="lg" className="mb-6" />
      <Card padding="lg" className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-h2 text-ink">Falta pouco</h1>
        <p className="mb-6 text-center text-small text-ink-3">
          Olá, <strong className="text-ink-2">{pending.name}</strong>! Para terminar seu cadastro com{' '}
          <strong className="break-all text-ink-2">{pending.email}</strong>:
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-small font-semibold text-ink">O que você quer fazer?</legend>
            <div className="flex gap-2">
              <Choice selected={role === 'RENTER'} onClick={() => setRole('RENTER')} title="Procuro vaga" hint="Quero alugar ou dividir" />
              <Choice selected={role === 'ADVERTISER'} onClick={() => setRole('ADVERTISER')} title="Tenho vaga" hint="Quero anunciar" />
            </div>
            {role === 'ADVERTISER' && (
              <div className="flex gap-2">
                <Choice selected={advertiserKind === 'VAGA'} onClick={() => setAdvertiserKind('VAGA')} title="Vaga pra dividir" hint="Moro no lugar" />
                <Choice selected={advertiserKind === 'ESTABELECIMENTO'} onClick={() => setAdvertiserKind('ESTABELECIMENTO')} title="Imóvel inteiro" hint="Proprietário ou imobiliária" />
              </div>
            )}
          </fieldset>

          <Input label="Data de nascimento" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <Input
              label="CPF"
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
            />
            <p className="text-caption text-ink-3">Usamos para evitar contas duplicadas ou falsas. Não aparece para outros usuários.</p>
          </div>

          <Checkbox
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            label={
              <>
                Li e aceito os{' '}
                <a href="/termos" target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-brand-strong">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-brand-strong">
                  Política de Privacidade
                </a>
                . Se eu informar alergias (dado de saúde, opcional), autorizo que fiquem guardadas no meu perfil.
              </>
            }
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" full disabled={loading || !ready}>
            {loading ? 'Criando…' : 'Criar minha conta'}
          </Button>
        </form>

        <p className="mt-5 text-center text-small text-ink-3">
          Não é você?{' '}
          <Link to="/login" onClick={clearPendingGoogleSignup} className="font-semibold text-brand hover:text-brand-strong">
            Usar outra conta
          </Link>
        </p>
        <LegalLinks className="mt-6" />
      </Card>
    </div>
  )
}
