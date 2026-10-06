import type { LucideIcon } from 'lucide-react'
import { Baby, Bath, BedDouble, Car, Cigarette, CigaretteOff, Dumbbell, Home, PartyPopper, PawPrint, ShieldCheck, ShowerHead, Users, WavesLadder } from 'lucide-react'
import { genderPreferenceLabels } from '../../constants/profileOptions'
import { formatResidents } from '../../utils/format'
import type { Listing } from '../../types'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** O que o anúncio informa, em plaquinhas com ícone (só o que foi preenchido). */
export default function ListingFeatures({ listing: l }: { listing: Listing }) {
  const items: Array<[LucideIcon, string]> = []
  if (l.availableSlots != null) items.push([Users, plural(l.availableSlots, 'vaga livre', 'vagas livres')])
  const residents = formatResidents(l.currentResidentsMale, l.currentResidentsFemale)
  if (residents) items.push([Home, residents])
  if (l.type === 'TEM_VAGA' && l.genderPreference !== 'QUALQUER') items.push([Users, genderPreferenceLabels[l.genderPreference]])
  if (l.acceptsPets != null) items.push([PawPrint, l.acceptsPets ? 'Aceita animais' : 'Não aceita animais'])
  if (l.acceptsSmoker != null) items.push([l.acceptsSmoker ? Cigarette : CigaretteOff, l.acceptsSmoker ? 'Aceita fumantes' : 'Não aceita fumantes'])
  if (l.bedrooms != null) items.push([BedDouble, plural(l.bedrooms, 'dormitório', 'dormitórios')])
  if (l.suites != null && l.suites > 0) items.push([ShowerHead, plural(l.suites, 'suíte', 'suítes')])
  if (l.bathrooms != null) items.push([Bath, plural(l.bathrooms, 'banheiro', 'banheiros')])
  if (l.parkingSpots != null) items.push([Car, l.parkingSpots === 0 ? 'Sem garagem' : plural(l.parkingSpots, 'vaga de garagem', 'vagas de garagem')])
  if (l.hasPool) items.push([WavesLadder, 'Piscina'])
  if (l.hasGym) items.push([Dumbbell, 'Academia'])
  if (l.hasPartyRoom) items.push([PartyPopper, 'Salão de festas'])
  if (l.hasPlayground) items.push([Baby, 'Playground'])
  if (l.hasConcierge24h) items.push([ShieldCheck, 'Portaria 24 horas'])
  if (items.length === 0) return null

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([Icon, label]) => (
        <li key={label} className="flex min-h-14 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-small font-semibold text-ink-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-strong">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {label}
        </li>
      ))}
    </ul>
  )
}
