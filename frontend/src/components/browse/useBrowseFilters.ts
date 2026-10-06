import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PriceRange } from './price'
import { amenityLabels, sortLabels, type Amenity, type SortKey } from './filters'

export type BrowseTab = 'ROOMMATES' | 'ESTABLISHMENTS'

/**
 * Filtros da busca guardados no endereço: voltar de um anúncio mantém a busca, recarregar
 * também, e o link pode ser compartilhado. Escreve com replace (não enche o histórico).
 *   tipo=imovel · bairro · lat · lng · min · max · compat · vagas · exclusiva · dorm · banh ·
 *   garagem · pet · fumante · lazer=piscina,academia · perfil=0 · ordem
 */
export function useBrowseFilters() {
  const [params, setParams] = useSearchParams()
  const num = (k: string) => { const v = params.get(k); return v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null }
  const flag = (k: string) => params.get(k) === '1'

  const tab: BrowseTab = params.get('tipo') === 'imovel' ? 'ESTABLISHMENTS' : 'ROOMMATES'
  const bairro = params.get('bairro') ?? ''
  const lat = num('lat'), lng = num('lng')
  const mapPoint = lat !== null && lng !== null ? { lat, lng } : null
  const min = num('min'), max = num('max')
  const urlPrice: PriceRange | null = min !== null && max !== null ? [min, max] : null
  const ordem = params.get('ordem')
  const sort: SortKey = ordem && ordem in sortLabels ? (ordem as SortKey) : 'compat'
  const amenities = (params.get('lazer') ?? '').split(',').filter((a): a is Amenity => a in amenityLabels)

  // O valor responde na hora por um estado local; o endereço vem logo atrás. Sem isso, arrastar
  // ou apertar a seta rápido perdia passos (a tela voltava ao valor antigo do endereço).
  // pending = último valor gravado que o endereço ainda não mostrou; enquanto existir, o que vem
  // do endereço é só eco das nossas gravações e é ignorado.
  const key = (r: PriceRange | null) => (r ? r.join('-') : '')
  const [price, setLocalPrice] = useState<PriceRange | null>(urlPrice)
  const [pending, setPending] = useState<string | null>(null)
  const [seenUrlKey, setSeenUrlKey] = useState(key(urlPrice))
  if (key(urlPrice) !== seenUrlKey) {
    setSeenUrlKey(key(urlPrice))
    if (pending === null) setLocalPrice(urlPrice)          // mudou por fora (voltar/avançar)
    else if (pending === key(urlPrice)) setPending(null)   // o endereço alcançou
  }

  const update = (changes: Record<string, string | number | null>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === '' || v === 0) next.delete(k)
        else next.set(k, String(v))
      }
      return next
    }, { replace: true })

  const setPrice = (r: PriceRange | null) => {
    setLocalPrice(r)
    if (key(r) !== key(urlPrice)) setPending(key(r))
    update({ min: r?.[0] ?? null, max: r?.[1] ?? null })
  }
  const CHOICES = { compat: null, vagas: null, exclusiva: null, dorm: null, banh: null, garagem: null, pet: null, fumante: null, lazer: null }

  return {
    tab, bairro, mapPoint, price, sort, amenities,
    compatMin: num('compat') ?? 0,
    slotsMin: num('vagas') ?? 0,
    onlyMyGender: flag('exclusiva'),
    bedroomsMin: num('dorm') ?? 0,
    bathroomsMin: num('banh') ?? 0,
    garage: flag('garagem'),
    pets: flag('pet'),
    smoker: flag('fumante'),
    matchProfile: params.get('perfil') !== '0',

    /** trocar entre vaga e imóvel recomeça os filtros de escolha (os valores mudam de escala) */
    setTab: (t: BrowseTab) => { setPrice(null); update({ tipo: t === 'ESTABLISHMENTS' ? 'imovel' : null, ...CHOICES }) },
    /** digitar um bairro desfaz o ponto do mapa */
    setBairro: (b: string) => update({ bairro: b, lat: null, lng: null }),
    /** ponto marcado no mapa: substitui o bairro digitado */
    setMapPoint: (p: { lat: number; lng: number } | null) => update({ lat: p?.lat ?? null, lng: p?.lng ?? null, ...(p ? { bairro: null } : {}) }),
    /** lugar escolhido no autocompletar: mantém o texto e acrescenta o ponto */
    setPlacePoint: (p: { lat: number; lng: number }) => update({ lat: p.lat, lng: p.lng }),
    setPrice,
    setSort: (s: SortKey) => update({ ordem: s === 'compat' ? null : s }),
    setCompatMin: (n: number) => update({ compat: n }),
    setSlotsMin: (n: number) => update({ vagas: n }),
    setOnlyMyGender: (v: boolean) => update({ exclusiva: v ? 1 : null }),
    setBedroomsMin: (n: number) => update({ dorm: n }),
    setBathroomsMin: (n: number) => update({ banh: n }),
    setGarage: (v: boolean) => update({ garagem: v ? 1 : null }),
    setPets: (v: boolean) => update({ pet: v ? 1 : null }),
    setSmoker: (v: boolean) => update({ fumante: v ? 1 : null }),
    toggleAmenity: (a: Amenity) => {
      const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a]
      update({ lazer: next.join(',') })
    },
    setMatchProfile: (v: boolean) => update({ perfil: v ? null : '0' }),
    clearAll: () => { setPrice(null); update({ bairro: null, lat: null, lng: null, ...CHOICES }) },
  }
}
