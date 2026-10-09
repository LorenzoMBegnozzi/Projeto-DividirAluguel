import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Cigarette, CigaretteOff, GraduationCap, Home, ImageOff, MapPin, PawPrint, Star, Users } from 'lucide-react'
import Avatar from '../Avatar'
import Fact from '../Fact'
import PropertyFacts from '../PropertyFacts'
import { Badge, Card, cx, focusRing } from '../ui'
import { dietLabels, genderPreferenceLabels, petPreferenceLabels, smokingHabitLabels } from '../../constants/profileOptions'
import { formatResidents } from '../../utils/format'
import type { BrowseItem } from '../../types'

/**
 * Anúncio na lista da busca: foto à esquerda (400 × ~262 no computador; em cima no celular)
 * e as informações à direita. O mapa e a descrição longa ficam na página do anúncio.
 */
export default function ListingRow({ item, kind, photos, onOpenPhotos, actions, below }: {
  item: BrowseItem
  /** vaga em casa com gente morando (mostra quem mora) ou imóvel inteiro (mostra o dono) */
  kind: 'vaga' | 'imovel'
  photos: string[] | undefined
  onOpenPhotos: () => void
  /** botões do rodapé (conversar, interesse) */
  actions: ReactNode
  /** conteúdo extra embaixo (ex.: quem mais se interessou) */
  below?: ReactNode
}) {
  const { listing: l, user: u } = item
  const residents = formatResidents(l.currentResidentsMale, l.currentResidentsFemale)
  const habits = [
    u.smokingHabit && smokingHabitLabels[u.smokingHabit],
    u.diet && (u.diet === 'OUTRO' && u.dietOther ? u.dietOther : dietLabels[u.diet]),
    u.petPreferences.length > 0 && u.petPreferences.map((p) => petPreferenceLabels[p]).join(', '),
  ].filter(Boolean)

  return (
    <Card as="article" padding="none" tone={kind === 'imovel' ? 'coral' : undefined} className="flex flex-col overflow-hidden transition-colors duration-(--dur-slow) sm:min-h-66 sm:flex-row">
      {/* foto (ou espaço neutro com o bairro) */}
      <div className="relative aspect-16/10 shrink-0 bg-surface-sunk sm:aspect-auto sm:w-64 md:w-80 lg:w-64 xl:w-100">
        {photos && photos.length > 0 ? (
          <button type="button" onClick={onOpenPhotos} aria-label="Ver fotos do anúncio" className={cx('absolute inset-0 block', focusRing)}>
            <img src={photos[0]} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-3">
            <div className="flex flex-col items-center gap-1.5 text-center">
              {photos ? <ImageOff className="size-7" aria-hidden="true" /> : <Home className="size-7 animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
              <span className="text-caption font-semibold">{photos ? 'Sem fotos' : 'Carregando fotos…'}</span>
            </div>
          </div>
        )}
        {l.highlighted && <Badge tone="warning" icon={Star} className="absolute top-3 left-3 shadow-sm">Destaque</Badge>}
        {photos && photos.length > 1 && (
          <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-sm bg-scrim px-2 py-0.5 text-caption font-bold text-on-inverse">
            <Camera className="size-3.5" aria-hidden="true" />{photos.length}
          </span>
        )}
      </div>

      {/* informações */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-h3 text-ink">
              <Link to={`/anuncios/${l.id}`} className={cx('line-clamp-2 rounded-sm hover:text-brand', focusRing)}>{l.title}</Link>
            </h2>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-small text-ink-3">
              {l.preferredNeighborhood && <Fact icon={MapPin}>{l.preferredNeighborhood}</Fact>}
              {l.nearCollege && <Fact icon={GraduationCap}>Perto de {l.nearCollege}</Fact>}
            </p>
          </div>
          <Compat score={item.compatibilityScore} />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-3">
          {l.availableSlots != null && <Fact icon={Users}>{l.availableSlots} {l.availableSlots === 1 ? 'vaga livre' : 'vagas livres'}</Fact>}
          {residents && <Fact icon={Home}>{residents}</Fact>}
          {kind === 'vaga' && l.genderPreference !== 'QUALQUER' && <Fact icon={Users}>{genderPreferenceLabels[l.genderPreference]}</Fact>}
          {l.acceptsPets != null && <Fact icon={PawPrint}>{l.acceptsPets ? 'Aceita pet' : 'Sem pet'}</Fact>}
          {l.acceptsSmoker != null && <Fact icon={l.acceptsSmoker ? Cigarette : CigaretteOff}>{l.acceptsSmoker ? 'Aceita fumante' : 'Sem fumante'}</Fact>}
          <PropertyFacts listing={l} />
        </div>

        {/* quem mora (vaga) ou quem anuncia (imóvel) */}
        <div className="flex min-w-0 items-center gap-2 text-caption text-ink-3">
          <Avatar photoUrl={u.photoUrl} name={u.name} size={28} />
          <span className="min-w-0 truncate">
            <span className="font-semibold text-ink-2">{u.name}</span>
            {kind === 'vaga' ? (
              <>{u.occupation && ` · ${u.occupation}`}{habits.length > 0 && ` · ${habits.join(' · ')}`}</>
            ) : (
              ' · anunciante'
            )}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
          <p className="text-ink">
            {l.price != null ? (
              <><span className="text-h2" data-preco={l.price}>R$ {Number(l.price).toLocaleString('pt-BR')}</span><span className="text-small text-ink-3"> /mês</span></>
            ) : (
              <span className="text-small text-ink-3">Valor não informado</span>
            )}
          </p>
          {/* celular: botões na largura toda (mais fácil de tocar); a partir do sm, à direita */}
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end [&>*]:grow sm:[&>*]:grow-0">{actions}</div>
        </div>
        {below}
      </div>
    </Card>
  )
}

/** Compatibilidade compacta (número + rótulo), na cor da faixa. */
function Compat({ score }: { score: number }) {
  const s = Math.min(100, Math.max(0, score))
  const tone = s >= 75 ? 'text-leaf bg-leaf-tint' : s >= 50 ? 'text-mel bg-mel-tint' : 'text-ink-2 bg-surface-sunk'
  return (
    <p className={cx('flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5 leading-none', tone)}>
      <span className="text-h3 tabular-nums">{s}%</span>
      <span className="mt-0.5 text-micro font-semibold">compatível</span>
    </p>
  )
}
