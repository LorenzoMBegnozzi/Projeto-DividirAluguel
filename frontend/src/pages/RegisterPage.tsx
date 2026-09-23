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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-brand-100">
          <h1 className="mb-1 text-center text-2xl font-bold text-brand-600">RachaAi</h1>
          <p className="mb-6 text-center text-sm text-zinc-500">O que você quer fazer?</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setRole('RENTER')}
              className="rounded-xl border-2 border-zinc-200 p-4 text-left transition hover:border-brand-500"
            >
              <p className="font-semibold text-zinc-800">Quero alugar</p>
              <p className="text-sm text-zinc-500">Estou procurando um lugar ou alguém pra dividir aluguel</p>
            </button>
            <button
              onClick={() => setRole('ADVERTISER')}
              className="rounded-xl border-2 border-zinc-200 p-4 text-left transition hover:border-brand-500"
            >
              <p className="font-semibold text-zinc-800">Quero anunciar</p>
              <p className="text-sm text-zinc-500">Tenho uma vaga sobrando ou um imóvel para alugar</p>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-brand-600">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (role === 'ADVERTISER' && !advertiserKind) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-brand-100">
          <button
            onClick={() => setRole(null)}
            className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            voltar
          </button>
          <h1 className="mb-1 text-center text-2xl font-bold text-brand-600">RachaAi</h1>
          <p className="mb-6 text-center text-sm text-zinc-500">O que você quer anunciar?</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setAdvertiserKind('VAGA')}
              className="rounded-xl border-2 border-zinc-200 p-4 text-left transition hover:border-brand-500"
            >
              <p className="font-semibold text-zinc-800">Tenho vaga pra dividir</p>
              <p className="text-sm text-zinc-500">Você mora no lugar e busca alguém compatível pra dividir</p>
            </button>
            <button
              onClick={() => setAdvertiserKind('ESTABELECIMENTO')}
              className="rounded-xl border-2 border-zinc-200 p-4 text-left transition hover:border-brand-500"
            >
              <p className="font-semibold text-zinc-800">Tenho um imóvel pra alugar</p>
              <p className="text-sm text-zinc-500">Você anuncia o imóvel inteiro, como imobiliária ou proprietário</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-brand-100">
        <button
          onClick={() => (role === 'ADVERTISER' ? setAdvertiserKind(null) : setRole(null))}
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          voltar
        </button>
        <h1 className="mb-1 text-center text-2xl font-bold text-brand-600">Criar conta</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          {role === 'RENTER' ? 'Conta para quem quer alugar' : 'Conta para quem quer anunciar'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Senha (mínimo 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
          <label className="text-xs font-medium text-zinc-500">Data de nascimento</label>
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="-mt-2 rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
          <label className="text-xs font-medium text-zinc-500">CPF</label>
          <input
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className="-mt-2 rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
          <p className="-mt-2 text-xs text-zinc-400">
            Usamos só para confirmar que você é maior de idade — não compartilhamos com ninguém.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-brand-600 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
