import { useEffect, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Minus, Plus, Repeat, ShieldCheck, Wallet } from 'lucide-react'
import { getPublicPrices } from '../../api/billing'
import { formatMoney } from '../../utils/format'
import type { PublicPrices } from '../../types'
import { DEFAULT_PRICES, simulate } from './priceSim'

// Preços: dois cartões com a MESMA estrutura (público → preço → explicação → itens → CTA).
// Por subgrid, público, preço e CTA ficam na mesma altura nos dois; explicação + itens fluem
// logo abaixo do preço. Os valores vêm do backend (GET /billing/precos,
// público): enquanto carrega, aparece o padrão esmaecido (mesmo tamanho, sem pulo de layout);
// se a API falhar, as linhas mostram "ao publicar" e o simulador avisa.

function usePublicPrices() {
  const [prices, setPrices] = useState<PublicPrices | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    getPublicPrices().then((p) => { if (alive) setPrices(p) }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])
  return { prices, failed }
}

function Line({ label, note, value, failed, loading }: { label: string; note: string; value: number; failed: boolean; loading: boolean }) {
  return (
    <li className="receipt-line">
      <span>
        <span className="block font-bold text-ink">{label}</span>
        <span className="block text-caption text-ink-3">{note}</span>
      </span>
      <span className="receipt-dots" aria-hidden="true" />
      <span className={`text-right font-extrabold text-ink${loading ? ' is-loading' : ''}`}>
        {failed ? <span className="text-caption font-semibold text-ink-3">ao publicar</span> : formatMoney(value)}
      </span>
    </li>
  )
}

function Simulator({ p, loading, failed }: { p: PublicPrices; loading: boolean; failed: boolean }) {
  const [n, setN] = useState(p.freeListings + 2)
  const [hl, setHl] = useState(false)
  const id = useId()
  const r = simulate(n, hl, p)
  return (
    <div className="sim" role="group" aria-labelledby={`${id}-t`}>
      <p id={`${id}-t`} className="sim-title">Simule</p>
      <div className="sim-row">
        <span className="text-small font-semibold text-ink-2" id={`${id}-n`}>Anúncios ativos</span>
        <div className="stepper" role="group" aria-labelledby={`${id}-n`}>
          <button type="button" aria-label="Menos um anúncio" disabled={n <= 1} onClick={() => setN((v) => Math.max(1, v - 1))}><Minus className="h-4 w-4" aria-hidden="true" /></button>
          <output aria-live="polite">{n}</output>
          <button type="button" aria-label="Mais um anúncio" disabled={n >= 10} onClick={() => setN((v) => Math.min(10, v + 1))}><Plus className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
      <label className="sim-check">
        <input type="checkbox" checked={hl} onChange={(e) => setHl(e.target.checked)} />
        <span>Destacar um anúncio no topo</span>
      </label>
      {failed ? (
        <p className="sim-total" aria-live="polite">Não deu para carregar os preços agora. O valor aparece na hora de publicar.</p>
      ) : (
        <p className={`sim-total${loading ? ' is-loading' : ''}`} aria-live="polite" aria-busy={loading}>
          <span className="block font-bold text-ink">{r.line}</span>
          <span className="block text-caption text-ink-3">{r.period}</span>
        </p>
      )}
    </div>
  )
}

const trust = [
  { icon: Wallet, text: 'Pagamento único pelo Mercado Pago (Pix, crédito ou débito)' },
  { icon: Repeat, text: 'Sem renovação automática' },
  { icon: ShieldCheck, text: 'Você tem 7 dias para desistir de uma compra e pedir o reembolso integral (CDC, art. 49).' },
]

export default function PricingSection() {
  const { prices, failed } = usePublicPrices()
  const loading = !prices && !failed
  const p = prices ?? DEFAULT_PRICES
  const free = p.freeListings

  return (
    <div>
      <div className="reveal mb-12 text-center">
        <p className="landing-kicker mb-3">preços</p>
        <h2 className="landing-h2 mx-auto max-w-2xl">Quem procura não paga. Quem anuncia, quase nunca.</h2>
      </div>

      <div className="price-grid">
        <div className="price-col lp-card reveal" data-tone="brand">
          <p className="landing-kicker">quem procura vaga</p>
          <p className="price-big">R$ 0</p>
          <div className="price-body">
          <p className="price-explain">para sempre, sem cartão</p>
          <ul className="price-items space-y-3">
            {['Ver todos os anúncios com a % de compatibilidade', 'Filtros por bairro, mapa e orçamento', 'Conversar com quem anuncia, sem limite', 'Avaliar quem já morou com você'].map((t) => (
              <li key={t} className="flex gap-3 text-body text-ink-2"><Check className="mt-0.5 h-4 w-4 flex-none text-brand" aria-hidden="true" />{t}</li>
            ))}
          </ul>
          </div>
          <Link to="/registro?perfil=procurar" className="landing-btn price-cta" data-tone="brand">Criar conta grátis <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>

        <div className="price-col lp-card reveal" data-tone="coral" style={{ '--i': 1 } as CSSProperties}>
          <p className="landing-kicker">quem anuncia</p>
          <p className={`price-big${loading ? ' is-loading' : ''}`}>{free} grátis</p>
          <div className="price-body">
          <div className="price-explain">
            <p>anúncios ativos ao mesmo tempo, sem mensalidade</p>
            <p className="price-define">
              <b>Ativo</b> é o anúncio publicado. Removeu um, a vaga grátis volta. Do {free + 1}º em diante, cada anúncio extra é pago e fica no ar por {p.extraListingDays} dias.
            </p>
          </div>
          <div className="price-items">
            <p className="mb-2 text-label uppercase text-ink-3">se quiser mais</p>
            <ul>
              <Line label="Anúncio extra" note={`a partir do ${free + 1}º · vale ${p.extraListingDays} dias`} value={p.extraListingPrice} failed={failed} loading={loading} />
              <Line label="Destaque no topo" note={`aparece antes dos outros · ${p.highlightDays} dias`} value={p.highlightPrice} failed={failed} loading={loading} />
            </ul>
            <Simulator key={free} p={p} loading={loading} failed={failed} />
          </div>
          </div>
          <Link to="/registro?perfil=anunciar" className="landing-btn price-cta" data-tone="coral">Anunciar grátis <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </div>

      <ul className="trust-strip reveal" aria-label="Pagamento e reembolso">
        {trust.map(({ icon: Icon, text }) => (
          <li key={text}><Icon className="h-5 w-5 flex-none" aria-hidden="true" /><span>{text}</span></li>
        ))}
      </ul>
    </div>
  )
}
