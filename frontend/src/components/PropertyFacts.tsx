import { Baby, Bath, BedDouble, Car, Dumbbell, PartyPopper, ShieldCheck, ShowerHead, WavesLadder } from 'lucide-react'
import Fact from './Fact'
import { parkingLayoutLabels } from '../constants/profileOptions'
import type { Listing } from '../types'

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

function parkingLabel(listing: Listing) {
  const spots = listing.parkingSpots ?? 0
  const kinds = [listing.parkingForCar && 'carro', listing.parkingForMotorcycle && 'moto'].filter(Boolean).join(' e ')
  const details = [
    kinds,
    listing.parkingLayout && parkingLayoutLabels[listing.parkingLayout].toLowerCase(),
    listing.parkingCovered != null && (listing.parkingCovered ? 'coberta' : 'descoberta'),
  ].filter(Boolean)
  const base = plural(spots, 'vaga de garagem', 'vagas de garagem')
  return details.length > 0 ? `${base} (${details.join(', ')})` : base
}

/** Dormitórios, banheiros, garagem e o que o condomínio tem. Só mostra o que foi informado. */
export default function PropertyFacts({ listing }: { listing: Listing }) {
  return (
    <>
      {listing.bedrooms != null && <Fact icon={BedDouble}>{plural(listing.bedrooms, 'dormitório', 'dormitórios')}</Fact>}
      {listing.suites != null && listing.suites > 0 && (
        <Fact icon={ShowerHead}>{plural(listing.suites, 'suíte', 'suítes')}</Fact>
      )}
      {listing.bathrooms != null && <Fact icon={Bath}>{plural(listing.bathrooms, 'banheiro social', 'banheiros sociais')}</Fact>}
      {listing.parkingSpots != null && (
        <Fact icon={Car}>{listing.parkingSpots === 0 ? 'Sem garagem' : parkingLabel(listing)}</Fact>
      )}
      {listing.hasPool && <Fact icon={WavesLadder}>Piscina</Fact>}
      {listing.hasPartyRoom && <Fact icon={PartyPopper}>Salão de festas</Fact>}
      {listing.hasGym && <Fact icon={Dumbbell}>Academia</Fact>}
      {listing.hasPlayground && <Fact icon={Baby}>Playground e brinquedoteca</Fact>}
      {listing.hasConcierge24h && <Fact icon={ShieldCheck}>Portaria 24 horas</Fact>}
    </>
  )
}
