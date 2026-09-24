export type Routine = 'DIURNO' | 'NOTURNO' | 'MISTO'

export type Role = 'RENTER' | 'ADVERTISER'

export type AdvertiserKind = 'VAGA' | 'ESTABELECIMENTO'

export type ListingType = 'TEM_VAGA' | 'ESTABELECIMENTO'

export type SmokingHabit = 'NAO_FUMO' | 'FUMO_SOCIALMENTE' | 'FUMO_QUANDO_BEBO' | 'FUMANTE' | 'TENTANDO_PARAR'

export type DrinkingHabit =
  | 'NAO_CURTO'
  | 'PAREI_DE_BEBER'
  | 'BEBO_COM_MODERACAO'
  | 'OCASIOES_ESPECIAIS'
  | 'SOCIALMENTE_FDS'
  | 'QUASE_TODA_NOITE'

export type Diet = 'ONIVORO' | 'VEGETARIANO' | 'VEGANO' | 'PESCETARIANO' | 'FLEXITARIANO'

export type PetPreference =
  | 'CACHORRO'
  | 'GATO'
  | 'REPTIL'
  | 'ANFIBIO'
  | 'PASSARINHO'
  | 'PEIXE'
  | 'TARTARUGA'
  | 'HAMSTER'
  | 'COELHO'
  | 'OUTRO_PET'
  | 'NAO_TENHO_MAS_AMO'
  | 'NAO_TENHO_PETS'
  | 'GOSTO_DE_TODOS'
  | 'QUERO_UM_PET'
  | 'TENHO_ALERGIA_A_PETS'
  | 'TENHO_PET_NAO_ESPECIFICADO'

export type AllergyTag =
  | 'POEIRA'
  | 'PELO_DE_ANIMAL'
  | 'POLEN_MOFO'
  | 'PICADA_DE_INSETO'
  | 'ALIMENTOS'
  | 'MEDICAMENTOS'
  | 'LATEX'
  | 'NENHUMA'
  | 'OUTRO'

export interface UserProfile {
  id: number
  name: string
  email: string
  birthDate: string
  renter: boolean
  advertiser: boolean
  advertiserKind: AdvertiserKind | null
  occupation: string | null
  bio: string | null
  smokingHabit: SmokingHabit | null
  drinkingHabit: DrinkingHabit | null
  diet: Diet | null
  petPreferences: PetPreference[]
  allergyTags: AllergyTag[]
  allergyOther: string | null
  musicTaste: string | null
  routine: Routine | null
  safetyTermsAccepted: boolean
  photoUrl: string | null
}

export interface Listing {
  id: number
  userId: number
  type: ListingType
  title: string
  description: string | null
  preferredNeighborhood: string | null
  nearCollege: string | null
  price: number | null
  availableSlots: number | null
  address: string | null
  latitude: number | null
  longitude: number | null
  acceptsPets: boolean | null
  acceptsSmoker: boolean | null
  highlighted: boolean
  highlightedUntil: string | null
  expiresAt: string | null
  createdAt: string
  available: boolean
  dealClosedWithUserId: number | null
  dealClosedWithUserName: string | null
}

export interface BrowseItem {
  user: UserProfile
  listing: Listing
  compatibilityScore: number
}

export interface ConversationSummary {
  id: number
  otherUser: UserProfile
  listing: Listing
  createdAt: string
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  sentAt: string
}

export interface AuthResponse {
  token: string
  user: UserProfile
}

export type PaymentType = 'ANUNCIO_EXTRA' | 'DESTAQUE'

export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO'

export interface Payment {
  id: number
  type: PaymentType
  listingId: number | null
  amount: number
  status: PaymentStatus
  createdAt: string
  paidAt: string | null
}

export interface Plan {
  freeListings: number
  freeListingsUsed: number
  extraCredits: number
  extraListingPrice: number
  extraListingDays: number
  highlightPrice: number
  highlightDays: number
  simulatedMode: boolean
}

export type ConvivioStatus = 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO'

export interface Convivio {
  id: number
  outroUsuarioId: number
  outroUsuarioNome: string
  periodoInicio: string
  periodoFim: string | null
  status: ConvivioStatus
  propostoPorMim: boolean
  avaliadoPorMim: boolean
  criadoEm: string
}

export interface Avaliacao {
  id: number
  avaliadorId: number
  avaliadorNome: string
  notaPontualidade: number
  notaConvivencia: number
  comentario: string | null
  periodoInicio: string
  periodoFim: string | null
  criadoEm: string
}

export interface AvaliacaoResumo {
  total: number
  mediaPontualidade: number
  mediaConvivencia: number
}

export type NotificationType =
  | 'NOVA_MENSAGEM'
  | 'NOVA_CONVERSA'
  | 'CONVIVIO_PROPOSTO'
  | 'CONVIVIO_CONFIRMADO'
  | 'CONVIVIO_RECUSADO'
  | 'AVALIACAO_RECEBIDA'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  message: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export type ReportReason = 'COMPORTAMENTO_SUSPEITO' | 'GOLPE_OU_FRAUDE' | 'CONTEUDO_IMPROPRIO' | 'ASSEDIO' | 'OUTRO'

export interface BlockedUser {
  id: number
  name: string
  createdAt: string
}
