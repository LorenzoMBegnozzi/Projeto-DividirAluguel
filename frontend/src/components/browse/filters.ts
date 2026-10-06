// Filtros e ordenação da busca, aplicados no navegador sobre a lista que o servidor devolve.
// O servidor já aplica: sexo da vaga x sexo do perfil, bloqueios e a % de compatibilidade (que
// usa os hábitos do cadastro). Aqui ficam os filtros de escolha da pessoa e as regras do
// "Combina com o meu perfil", que cruzam o cadastro com o que o anúncio informa.
import type { BrowseItem, Listing, UserProfile } from '../../types'
import type { PriceRange } from './price'

export type SortKey = 'compat' | 'menor' | 'maior' | 'recentes'
export const sortLabels: Record<SortKey, string> = {
  compat: 'Mais compatíveis',
  menor: 'Menor valor',
  maior: 'Maior valor',
  recentes: 'Mais recentes',
}

export type Amenity = 'piscina' | 'academia' | 'salao' | 'portaria' | 'playground'
export const amenityLabels: Record<Amenity, string> = {
  piscina: 'Piscina',
  academia: 'Academia',
  salao: 'Salão de festas',
  portaria: 'Portaria 24 h',
  playground: 'Playground',
}
const amenityField: Record<Amenity, keyof Listing> = {
  piscina: 'hasPool', academia: 'hasGym', salao: 'hasPartyRoom', portaria: 'hasConcierge24h', playground: 'hasPlayground',
}

export interface FilterState {
  price: PriceRange | null          // já normalizado (null = sem filtro)
  priceIsOpenEnded: boolean         // alça máxima no fim da barra = "ou mais"
  compatMin: number                 // 0 = qualquer
  slotsMin: number                  // vagas disponíveis (0 = qualquer)
  onlyMyGender: boolean             // só vagas exclusivas do meu sexo
  bedroomsMin: number
  bathroomsMin: number
  garage: boolean
  pets: boolean
  smoker: boolean
  amenities: Amenity[]
  matchProfile: boolean             // regras do cadastro (ligado por padrão)
}

const SMOKERS = new Set(['FUMANTE', 'FUMO_SOCIALMENTE', 'FUMO_QUANDO_BEBO', 'TENTANDO_PARAR'])
const HAS_PET = new Set(['CACHORRO', 'GATO', 'REPTIL', 'ANFIBIO', 'PASSARINHO', 'PEIXE', 'TARTARUGA', 'HAMSTER', 'COELHO', 'OUTRO_PET', 'TENHO_PET_NAO_ESPECIFICADO'])

/** Regras que o cadastro permite aplicar sozinho. Cada uma diz o porquê, em texto curto. */
export interface ProfileRule { id: string; reason: string; excludes: (l: Listing) => boolean }
export function profileRules(user: UserProfile | null): ProfileRule[] {
  if (!user) return []
  const rules: ProfileRule[] = []
  if (user.petPreferences.some((p) => HAS_PET.has(p)))
    rules.push({ id: 'pet', reason: 'Você tem pet: só lugares que aceitam', excludes: (l) => l.acceptsPets === false })
  if (user.petPreferences.includes('TENHO_ALERGIA_A_PETS') || user.allergyTags.includes('PELO_DE_ANIMAL'))
    rules.push({ id: 'alergia', reason: 'Alergia a pelo: sem lugares que aceitam pet', excludes: (l) => l.acceptsPets === true })
  if (user.smokingHabit && SMOKERS.has(user.smokingHabit))
    rules.push({ id: 'fumo', reason: 'Você fuma: só lugares que aceitam fumante', excludes: (l) => l.acceptsSmoker === false })
  if (user.needsCarParking)
    rules.push({ id: 'carro', reason: 'Precisa de garagem para carro', excludes: (l) => l.parkingSpots === 0 || l.parkingForCar === false })
  if (user.needsMotorcycleParking)
    rules.push({ id: 'moto', reason: 'Precisa de garagem para moto', excludes: (l) => l.parkingSpots === 0 || l.parkingForMotorcycle === false })
  return rules
}

/** Cada filtro como função; "skip" deixa calcular as contagens de uma opção sem ela mesma. */
function predicates(f: FilterState, rules: ProfileRule[], myGender: UserProfile['gender'], skip?: keyof FilterState) {
  const p: Array<[keyof FilterState, (i: BrowseItem) => boolean]> = []
  const L = (i: BrowseItem) => i.listing
  if (f.price) {
    const [lo, hi] = f.price
    p.push(['price', (i) => L(i).price != null && Number(L(i).price) >= lo && (f.priceIsOpenEnded || Number(L(i).price) <= hi)])
  }
  if (f.compatMin) p.push(['compatMin', (i) => i.compatibilityScore >= f.compatMin])
  if (f.slotsMin) p.push(['slotsMin', (i) => (L(i).availableSlots ?? 0) >= f.slotsMin])
  if (f.onlyMyGender && (myGender === 'FEMININO' || myGender === 'MASCULINO')) p.push(['onlyMyGender', (i) => L(i).genderPreference === myGender])
  if (f.bedroomsMin) p.push(['bedroomsMin', (i) => (L(i).bedrooms ?? 0) >= f.bedroomsMin])
  if (f.bathroomsMin) p.push(['bathroomsMin', (i) => (L(i).bathrooms ?? 0) >= f.bathroomsMin])
  if (f.garage) p.push(['garage', (i) => (L(i).parkingSpots ?? 0) > 0])
  if (f.pets) p.push(['pets', (i) => L(i).acceptsPets === true])
  if (f.smoker) p.push(['smoker', (i) => L(i).acceptsSmoker === true])
  for (const a of f.amenities) p.push(['amenities', (i) => L(i)[amenityField[a]] === true])
  if (f.matchProfile && rules.length) p.push(['matchProfile', (i) => !rules.some((r) => r.excludes(L(i)))])
  return p.filter(([k]) => k !== skip).map(([, fn]) => fn)
}

export function applyFilters(items: BrowseItem[], f: FilterState, rules: ProfileRule[], myGender: UserProfile['gender'], skip?: keyof FilterState) {
  const ps = predicates(f, rules, myGender, skip)
  return ps.length ? items.filter((i) => ps.every((fn) => fn(i))) : items
}

/** Quantos sobram se a opção for ligada (com os outros filtros valendo). */
export function countWith(items: BrowseItem[], f: FilterState, rules: ProfileRule[], myGender: UserProfile['gender'], change: Partial<FilterState>) {
  return applyFilters(items, { ...f, ...change }, rules, myGender).length
}

export function hiddenByProfile(items: BrowseItem[], f: FilterState, rules: ProfileRule[], myGender: UserProfile['gender']) {
  if (!f.matchProfile || !rules.length) return 0
  return applyFilters(items, f, rules, myGender, 'matchProfile').length - applyFilters(items, f, rules, myGender).length
}

/** Ordenação. "Mais compatíveis" mantém a ordem do servidor (destaques pagos primeiro). */
export function sortItems(items: BrowseItem[], key: SortKey) {
  if (key === 'compat') return items
  const price = (i: BrowseItem) => (i.listing.price == null ? null : Number(i.listing.price))
  const copy = [...items]
  if (key === 'recentes') return copy.sort((a, b) => b.listing.createdAt.localeCompare(a.listing.createdAt))
  // sem valor informado vai para o fim nas duas ordens
  return copy.sort((a, b) => {
    const pa = price(a), pb = price(b)
    if (pa === null) return pb === null ? 0 : 1
    if (pb === null) return -1
    return key === 'menor' ? pa - pb : pb - pa
  })
}

/** Quais grupos de filtro fazem sentido para a lista atual (esconde o que nenhum anúncio informa). */
export function availableFacets(items: BrowseItem[]) {
  const has = (fn: (l: Listing) => boolean) => items.some((i) => fn(i.listing))
  return {
    slots: has((l) => (l.availableSlots ?? 0) > 1),
    bedrooms: has((l) => l.bedrooms != null),
    bathrooms: has((l) => l.bathrooms != null),
    garage: has((l) => (l.parkingSpots ?? 0) > 0),
    pets: has((l) => l.acceptsPets === true),
    smoker: has((l) => l.acceptsSmoker === true),
    amenities: (Object.keys(amenityField) as Amenity[]).filter((a) => has((l) => l[amenityField[a]] === true)),
  }
}

/** Quantos filtros de escolha estão ligados (para o "Filtros (n)" do celular). */
export function activeFilterCount(f: FilterState, hasLocation: boolean) {
  return (hasLocation ? 1 : 0) + (f.price ? 1 : 0) + (f.compatMin ? 1 : 0) + (f.slotsMin ? 1 : 0) + (f.onlyMyGender ? 1 : 0) +
    (f.bedroomsMin ? 1 : 0) + (f.bathroomsMin ? 1 : 0) + (f.garage ? 1 : 0) + (f.pets ? 1 : 0) + (f.smoker ? 1 : 0) + f.amenities.length
}
