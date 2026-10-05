import { useState } from 'react'
import { LogoLink } from '../components/Logo'
import LegalLinks from '../components/LegalLinks'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'
import type { AdvertiserKind, Role } from '../types'
import { Alert, Button, Card, Checkbox, Input, cx, fieldClass, focusRing } from '../components/ui'

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// /registro?perfil=procurar|anunciar (botões da landing) já abre no perfil escolhido
const PERFIL_ROLE: Record<string, Role> = { procurar: 'RENTER', anunciar: 'ADVERTISER' }

// opção grande (painel interno clicável) das duas primeiras etapas
const optionCardClass = cx(
  'rounded-lg border border-field bg-surface p-4 text-left transition-colors duration-(--dur-fast) hover:border-ink',
  focusRing,
)

const pageClass = 'flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState<Role | null>(() => PERFIL_ROLE[searchParams.get('perfil') ?? ''] ?? null)
  const [advertiserKind, setAdvertiserKind] = useState<AdvertiserKind | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [cpf, setCpf] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!role) return
    setError(null)
    setLoading(true)
    try {
      await register(name, email, password, birthDate, cpf.replace(/\D/g, ''), role, advertiserKind, acceptTerms)
      navigate(role === 'RENTER' ? '/onboarding' : '/perfil')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível criar a conta'))
    } finally {
      setLoading(false)
    }
  }

  if (!role) {
    return (
      <div className={pageClass}>
        <h1 className="mb-6 flex justify-center">
          <LogoLink size="lg" />
        </h1>
        <Card padding="lg" className="w-full max-w-sm">
          <p className="mb-6 text-center text-small text-ink-3">O que você quer fazer?</p>

          <div className="flex flex-col gap-3">
            <button onClick={() => setRole('RENTER')} className={optionCardClass}>
              <p className="text-body font-semibold text-ink">Quero alugar</p>
              <p className="text-small text-ink-3">Preciso de uma vaga ou alguém pra dividir aluguel</p>
            </button>
            <button onClick={() => setRole('ADVERTISER')} className={optionCardClass}>
              <p className="text-body font-semibold text-ink">Quero anunciar</p>
              <p className="text-small text-ink-3">Tenho uma vaga sobrando ou um imóvel para alugar</p>
            </button>
          </div>

          <p className="mt-6 text-center text-small text-ink-3">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-brand hover:text-brand-strong">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    )
  }

  if (role === 'ADVERTISER' && !advertiserKind) {
    return (
      <div className={pageClass}>
        <h1 className="mb-6 flex justify-center">
          <LogoLink size="lg" />
        </h1>
        <Card padding="lg" className="w-full max-w-sm">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setRole(null)} className="-ml-3 mb-3">
            voltar
          </Button>
          <p className="mb-6 text-center text-small text-ink-3">O que você quer anunciar?</p>

          <div className="flex flex-col gap-3">
            <button onClick={() => setAdvertiserKind('VAGA')} className={optionCardClass}>
              <p className="text-body font-semibold text-ink">Tenho vaga pra dividir</p>
              <p className="text-small text-ink-3">Você mora no lugar e busca alguém compatível pra dividir</p>
            </button>
            <button onClick={() => setAdvertiserKind('ESTABELECIMENTO')} className={optionCardClass}>
              <p className="text-body font-semibold text-ink">Tenho um imóvel pra alugar</p>
              <p className="text-small text-ink-3">Você anuncia o imóvel inteiro, como imobiliária ou proprietário</p>
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={pageClass}>
      <LogoLink size="lg" className="mb-6" />
      <Card padding="lg" className="w-full max-w-sm">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => (role === 'ADVERTISER' ? setAdvertiserKind(null) : setRole(null))}
          className="-ml-3 mb-3"
        >
          voltar
        </Button>
        <h1 className="mb-1 text-center text-h2 text-ink">Criar conta</h1>
        <p className="mb-6 text-center text-small text-ink-3">
          {role === 'RENTER' ? 'Conta para quem quer alugar' : 'Conta para quem quer anunciar'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass()}
          />
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass()}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Senha (mínimo 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass()}
          />
          <Input
            label="Data de nascimento"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <Input
            label="CPF"
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
          />
          <p className="-mt-1.5 text-caption text-ink-3">
            Usamos para evitar contas duplicadas ou falsas. Não aparece para outros usuários.
          </p>
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
          <Button type="submit" full disabled={loading || !acceptTerms} className="mt-2">
            {loading ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
        <LegalLinks className="mt-6" />
      </Card>
    </div>
  )
}
