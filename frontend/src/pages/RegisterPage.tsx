import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'
import type { AdvertiserKind, Role } from '../types'

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const inputClass =
  'h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

const optionCardClass =
  'rounded-md border border-line-strong p-4 text-left transition hover:border-ink'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [advertiserKind, setAdvertiserKind] = useState<AdvertiserKind | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!role) return
    setError(null)
    setLoading(true)
    try {
      await register(name, email, password, birthDate, cpf.replace(/\D/g, ''), role, advertiserKind)
      navigate('/perfil')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível criar a conta'))
    } finally {
      setLoading(false)
    }
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
          <h1 className="mb-1 text-center text-2xl font-black tracking-tight text-ink">
            Racha<span className="text-brand">Ai</span>
          </h1>
          <p className="mb-6 text-center text-sm text-ink-3">O que você quer fazer?</p>

          <div className="flex flex-col gap-3">
            <button onClick={() => setRole('RENTER')} className={optionCardClass}>
              <p className="font-semibold text-ink">Quero alugar</p>
              <p className="text-sm text-ink-3">Preciso de uma vaga ou alguém pra dividir aluguel</p>
            </button>
            <button onClick={() => setRole('ADVERTISER')} className={optionCardClass}>
              <p className="font-semibold text-ink">Quero anunciar</p>
              <p className="text-sm text-ink-3">Tenho uma vaga sobrando ou um imóvel para alugar</p>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-3">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-brand hover:text-brand-strong">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (role === 'ADVERTISER' && !advertiserKind) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
          <button
            onClick={() => setRole(null)}
            className="mb-3 inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            voltar
          </button>
          <h1 className="mb-1 text-center text-2xl font-black tracking-tight text-ink">
            Racha<span className="text-brand">Ai</span>
          </h1>
          <p className="mb-6 text-center text-sm text-ink-3">O que você quer anunciar?</p>

          <div className="flex flex-col gap-3">
            <button onClick={() => setAdvertiserKind('VAGA')} className={optionCardClass}>
              <p className="font-semibold text-ink">Tenho vaga pra dividir</p>
              <p className="text-sm text-ink-3">Você mora no lugar e busca alguém compatível pra dividir</p>
            </button>
            <button onClick={() => setAdvertiserKind('ESTABELECIMENTO')} className={optionCardClass}>
              <p className="font-semibold text-ink">Tenho um imóvel pra alugar</p>
              <p className="text-sm text-ink-3">Você anuncia o imóvel inteiro, como imobiliária ou proprietário</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <button
          onClick={() => (role === 'ADVERTISER' ? setAdvertiserKind(null) : setRole(null))}
          className="mb-3 inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          voltar
        </button>
        <h1 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-ink">Criar conta</h1>
        <p className="mb-6 text-center text-sm text-ink-3">
          {role === 'RENTER' ? 'Conta para quem quer alugar' : 'Conta para quem quer anunciar'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Senha (mínimo 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <label className="text-[13px] font-semibold text-ink">Data de nascimento</label>
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={`-mt-2 ${inputClass}`}
          />
          <label className="text-[13px] font-semibold text-ink">CPF</label>
          <input
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className={`-mt-2 ${inputClass}`}
          />
          <p className="-mt-2 text-[13px] text-ink-3">
            Usamos só para confirmar que você é maior de idade — não compartilhamos com ninguém.
          </p>
          {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-[42px] rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
