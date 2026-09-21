export type Routine = 'DIURNO' | 'NOTURNO' | 'MISTO'

export type Role = 'RENTER' | 'ADVERTISER'

export type ListingType = 'PROCURANDO' | 'TEM_VAGA' | 'ESTABELECIMENTO'

export interface UserProfile {
  id: number
  name: string
  email: string
  birthDate: string
  role: Role
  occupation: string | null
  bio: string | null
  smoker: boolean | null
  drinksAlcohol: boolean | null
  vegetarian: boolean | null
  hasPets: boolean | null
  likesAnimals: boolean | null
  allergies: string | null
  musicTaste: string | null
  routine: Routine | null
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
  address: string | null
  latitude: number | null
  longitude: number | null
  acceptsPets: boolean | null
  acceptsSmoker: boolean | null
  highlighted: boolean
  highlightedUntil: string | null
  expiresAt: string | null
  createdAt: string
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
