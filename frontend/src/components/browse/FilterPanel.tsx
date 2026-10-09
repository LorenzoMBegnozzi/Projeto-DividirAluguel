import type { ReactNode } from 'react'
import { MapPinned, Sparkles } from 'lucide-react'
import { Button, Checkbox, Chip, Toggle, cx, fieldClass, focusRing } from '../ui'
import LocationAutocomplete, { type LocalOption } from '../LocationAutocomplete'
import PriceFilter from './PriceFilter'
import type { PriceStats } from './price'
import type { useBrowseFilters } from './useBrowseFilters'
import { amenityLabels, type Amenity, type FilterState, type ProfileRule } from './filters'
import type { UserProfile } from '../../types'

type Filters = ReturnType<typeof useBrowseFilters>

/**
 * Todos os filtros da busca, em blocos. O mesmo componente vai na barra lateral (computador)
 * e na gaveta (celular). Cada opção mostra quantos anúncios sobram se for ligada; blocos que
 * nenhum anúncio da lista informa não aparecem.
 */
export default function FilterPanel({ f, state, stats, priceMatching, facets, count, rules, hidden, myGender, onOpenMap, onClear, activeCount, placeOptions }: {
  f: Filters
  state: FilterState
  stats: PriceStats | null
  priceMatching: number
  facets: { slots: boolean; bedrooms: boolean; bathrooms: boolean; garage: boolean; pets: boolean; smoker: boolean; amenities: Amenity[] }
  /** quantos sobram com essa mudança (os outros filtros valendo) */
  count: (change: Partial<FilterState>) => number
  rules: ProfileRule[]
  /** escondidos agora pelas regras do perfil */
  hidden: number
  myGender: UserProfile['gender']
  onOpenMap: () => void
  /** bairros/faculdades dos anúncios: sugeridos já da primeira letra */
  placeOptions: LocalOption[]
  onClear: () => void
  activeCount: number
}) {
  const isVaga = f.tab === 'ROOMMATES'
  const exclusiveLabel = myGender === 'FEMININO' ? 'Só para mulheres' : myGender === 'MASCULINO' ? 'Só para homens' : null

  return (
    <div className="space-y-6">
      <Block title="Onde">
        <LocationAutocomplete
          value={f.bairro}
          onChange={f.setBairro}
          onSelectPlace={(p) => f.setPlacePoint({ lat: p.lat, lng: p.lon })}
          localOptions={placeOptions}
          placeholder="Bairro ou faculdade"
          className={fieldClass()}
        />
        {f.mapPoint && <p className="mt-2 text-caption text-ink-3">Anúncios num raio perto do local escolhido.</p>}
        {/* todas as vagas (azul) e imóveis (coral) num mapa, com um balão por anúncio */}
        <Button variant="secondary" icon={MapPinned} onClick={onOpenMap} full className="mt-2">Ver no mapa</Button>
      </Block>

      {stats && (
        <Block title="Valor por mês">
          <PriceFilter stats={stats} value={f.price} onChange={f.setPrice} matching={priceMatching} />
        </Block>
      )}

      {rules.length > 0 && (
        <Block title="Do seu perfil">
          <div className="rounded-lg border border-line bg-surface-sunk p-3">
            <Toggle
              checked={f.matchProfile}
              onChange={f.setMatchProfile}
              label={<span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-brand" aria-hidden="true" />Combina com o meu perfil</span>}
              hint={f.matchProfile && hidden > 0 ? `${hidden} ${hidden === 1 ? 'anúncio escondido' : 'anúncios escondidos'} por não combinar` : 'Usa o que você marcou no cadastro'}
            />
            <ul className="mt-2 space-y-1 text-caption text-ink-3">
              {rules.map((r) => <li key={r.id}>· {r.reason}</li>)}
            </ul>
          </div>
        </Block>
      )}

      <Block title="Compatibilidade mínima">
        <Options
          value={state.compatMin}
          onChange={f.setCompatMin}
          options={[[0, 'Qualquer'], [50, '50%+'], [70, '70%+'], [90, '90%+']]}
          count={(v) => count({ compatMin: v })}
        />
      </Block>

      {isVaga && (facets.slots || exclusiveLabel) && (
        <Block title="A vaga">
          {facets.slots && (
            <Options label="Vagas livres" value={state.slotsMin} onChange={f.setSlotsMin} options={[[0, 'Qualquer'], [2, '2 ou mais']]} count={(v) => count({ slotsMin: v })} />
          )}
          {exclusiveLabel && (
            <Toggle className="mt-2" checked={state.onlyMyGender} onChange={f.setOnlyMyGender} label={exclusiveLabel} hint={plural(count({ onlyMyGender: true }))} />
          )}
        </Block>
      )}

      {(facets.bedrooms || facets.bathrooms) && (
        <Block title="O imóvel">
          {facets.bedrooms && (
            <Options label="Dormitórios" value={state.bedroomsMin} onChange={f.setBedroomsMin} options={[[0, 'Qualquer'], [1, '1+'], [2, '2+'], [3, '3+']]} count={(v) => count({ bedroomsMin: v })} />
          )}
          {facets.bathrooms && (
            <Options className="mt-3" label="Banheiros" value={state.bathroomsMin} onChange={f.setBathroomsMin} options={[[0, 'Qualquer'], [1, '1+'], [2, '2+']]} count={(v) => count({ bathroomsMin: v })} />
          )}
        </Block>
      )}

      {(facets.garage || facets.pets || facets.smoker || facets.amenities.length > 0) && (
        <Block title="Precisa ter">
          <div className="grid">
            {facets.garage && <Check label="Garagem" checked={state.garage} onChange={f.setGarage} n={count({ garage: true })} />}
            {facets.pets && <Check label="Aceita pet" checked={state.pets} onChange={f.setPets} n={count({ pets: true })} />}
            {facets.smoker && <Check label="Aceita fumante" checked={state.smoker} onChange={f.setSmoker} n={count({ smoker: true })} />}
            {facets.amenities.map((a) => (
              <Check key={a} label={amenityLabels[a]} checked={state.amenities.includes(a)} onChange={() => f.toggleAmenity(a)}
                n={count({ amenities: state.amenities.includes(a) ? state.amenities : [...state.amenities, a] })} />
            ))}
          </div>
        </Block>
      )}

      {activeCount > 0 && (
        <button type="button" onClick={onClear} className={cx('min-h-11 rounded-sm text-small font-semibold text-ink-3 hover:text-danger', focusRing)}>
          Limpar todos os filtros
        </button>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-label uppercase text-ink-3">{title}</h3>
      {children}
    </section>
  )
}

/** Escolha única em chips, com a contagem de cada opção. */
function Options<T extends number>({ label, value, onChange, options, count, className }: {
  label?: string; value: T; onChange: (v: T) => void; options: Array<[T, string]>; count: (v: T) => number; className?: string
}) {
  return (
    <div className={className} role="group" aria-label={label}>
      {label && <p className="mb-1.5 text-small font-semibold text-ink-2">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, text]) => {
          const n = v ? count(v) : null
          return (
            <Chip key={v} size="sm" pressed={value === v} onClick={() => onChange(v)} disabled={n === 0 && value !== v} className="disabled:opacity-45">
              {text}{n !== null && <span className="text-ink-3 tabular-nums">{n}</span>}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}

function Check({ label, checked, onChange, n }: { label: string; checked: boolean; onChange: (v: boolean) => void; n: number }) {
  return (
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={n === 0 && !checked}
      // a caixinha à esquerda; o nome logo ao lado e a contagem encostada à direita
      className="w-full py-1.5 has-disabled:opacity-45 [&>span]:flex-1"
      label={<span className="flex justify-between gap-3"><span>{label}</span><span className="tabular-nums text-ink-3">{n}</span></span>}
    />
  )
}

const plural = (n: number) => (n === 1 ? '1 anúncio' : `${n} anúncios`)
