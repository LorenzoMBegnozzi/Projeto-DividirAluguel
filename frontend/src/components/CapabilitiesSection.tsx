import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Megaphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { enableAdvertiser, enableRenter } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import type { AdvertiserKind } from '../types'
import { Alert, Button, Card, cx, focusRing } from './ui'

const optionCardClass = cx(
  'rounded-md border border-field bg-surface p-3 text-left transition-colors duration-(--dur-fast) hover:border-ink disabled:opacity-55 motion-reduce:transition-none',
  focusRing,
)

export default function CapabilitiesSection() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [choosingKind, setChoosingKind] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || (user.renter && user.advertiser)) return null

  async function handleEnableRenter() {
    setError(null)
    setLoading(true)
    try {
      await enableRenter()
      await refreshUser()
      navigate('/browse')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível ativar a busca por vaga'))
      setLoading(false)
    }
  }

  async function handleEnableAdvertiser(kind: AdvertiserKind) {
    setError(null)
    setLoading(true)
    try {
      await enableAdvertiser(kind)
      await refreshUser()
      setChoosingKind(false)
      navigate('/anuncio')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível ativar o modo anunciante'))
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto mt-6 max-w-2xl">
      <h2 className="mb-1 text-h3 text-ink">Quero também...</h2>
      <p className="mb-4 text-small text-ink-3">Você pode ativar as duas coisas na mesma conta, sem precisar cadastrar de novo.</p>

      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

      <div className="flex flex-col gap-3">
        {!user.renter && (
          <button
            type="button"
            onClick={handleEnableRenter}
            disabled={loading}
            className={cx(optionCardClass, 'flex items-center gap-3')}
          >
            <Home className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-ink">Procurar uma vaga</span>
              <span className="block text-small text-ink-3">Passa a poder buscar e conversar com anunciantes</span>
            </span>
          </button>
        )}

        {!user.advertiser && !choosingKind && (
          <button
            type="button"
            onClick={() => setChoosingKind(true)}
            disabled={loading}
            className={cx(optionCardClass, 'flex items-center gap-3')}
          >
            <Megaphone className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-ink">Anunciar uma vaga ou imóvel</span>
              <span className="block text-small text-ink-3">Passa a poder publicar anúncios</span>
            </span>
          </button>
        )}

        {!user.advertiser && choosingKind && (
          <Card tone="sunk" padding="sm" className="flex flex-col gap-2">
            <p className="mb-1 text-small font-semibold text-ink">O que você quer anunciar?</p>
            <button
              type="button"
              onClick={() => handleEnableAdvertiser('VAGA')}
              disabled={loading}
              className={optionCardClass}
            >
              <p className="font-semibold text-ink">Tenho vaga pra dividir</p>
              <p className="text-small text-ink-3">Você mora no lugar e busca alguém compatível pra dividir</p>
            </button>
            <button
              type="button"
              onClick={() => handleEnableAdvertiser('ESTABELECIMENTO')}
              disabled={loading}
              className={optionCardClass}
            >
              <p className="font-semibold text-ink">Tenho um imóvel pra alugar</p>
              <p className="text-small text-ink-3">Você anuncia o imóvel inteiro, como imobiliária ou proprietário</p>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChoosingKind(false)}
              disabled={loading}
              className="mt-1 self-start"
            >
              Cancelar
            </Button>
          </Card>
        )}
      </div>
    </Card>
  )
}
