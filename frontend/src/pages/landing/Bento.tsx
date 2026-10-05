import type { CSSProperties, ReactNode } from 'react'
import { GraduationCap, MapPin, Star } from 'lucide-react'

// Recursos em mosaico. Mesma anatomia em todos os cartões: arte num painel embutido em cima,
// título e texto embaixo. Cada arte é um micro-loop de CSS (3–5 s) que só roda com o cartão na
// tela (`is-playing`, ver motion.ts) e fica um pouco mais intenso no hover. O CSS de base é o
// estado final da arte: sem JS ou com movimento reduzido ela aparece pronta, parada.
// As artes são decorativas (aria-hidden); o significado está no título e no texto.

const d = (i: number) => ({ '--i': i }) as CSSProperties

function Card({ className = '', title, text, children, i }: { className?: string; title: string; text: string; children: ReactNode; i: number }) {
  return (
    <div className={`bento-card lp-card reveal ${className}`} style={d(i)} data-loop>
      <div className="bento-art" aria-hidden="true">{children}</div>
      <div className="bento-copy">
        <h3 className="mb-1.5 text-h3 font-extrabold text-ink">{title}</h3>
        <p className="text-small text-ink-2">{text}</p>
      </div>
    </div>
  )
}

/** Hábitos de duas pessoas genéricas; os pares em comum (mesmo índice) vão para o centro. */
const you = ['Não fuma', 'Tem gato', 'Dorme cedo', 'Toca violão']
const them = ['Não fuma', 'Aceita pet', 'Dorme cedo', 'Estuda à noite']
const match = [true, true, true, false]

export default function Bento() {
  return (
    <div>
      <p className="landing-kicker reveal mb-3">recursos</p>
      <h2 className="landing-h2 reveal mb-12 max-w-xl">Feito para a convivência dar certo</h2>
      <div className="bento">
        <Card className="b-compat" i={0} title="Compatibilidade por hábitos" text="Fumo, bebida, alimentação, pets, rotina, barulho e visitas entram na conta. Coisa concreta, não horóscopo.">
          <div className="art-compat">
            {[{ n: 'Você', l: 'V', h: you, side: 'l' }, { n: 'Marina', l: 'M', h: them, side: 'r' }].map((p) => (
              <div key={p.n} className={`compat-col is-${p.side}`}>
                <span className="compat-who"><i>{p.l}</i>{p.n}</span>
                {p.h.map((h, i) => (
                  <span key={h} className={`compat-chip${match[i] ? ' is-match' : ''}`} style={d(i)}>{h}</span>
                ))}
              </div>
            ))}
            <div className="art-gauge">
              <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" className="gauge-track" /><circle cx="60" cy="60" r="50" className="gauge-fill" pathLength="100" /></svg>
              <span className="gauge-num" />
              <span className="gauge-cap">em comum</span>
            </div>
          </div>
        </Card>

        <Card className="b-map" i={1} title="Perto da faculdade" text="Filtre por bairro ou marque um ponto no mapa e veja só o que fica perto de onde você precisa estar.">
          <div className="art-map">
            <span className="map-road r1" /><span className="map-road r2" /><span className="map-road r3" /><span className="map-road r4" />
            <span className="map-radius" /><span className="map-radius is-echo" />
            <span className="map-college"><GraduationCap /></span>
            {[[34, 30], [62, 38], [44, 66], [88, 22]].map(([x, y], i) => (
              <MapPin key={i} className={`map-pin${i === 3 ? ' is-out' : ''}`} style={{ left: `${x}%`, top: `${y}%`, ...d(i) }} />
            ))}
            <span className="map-tag">dentro do raio</span>
          </div>
        </Card>

        <Card className="b-small" i={2} title="Conversa direta" text="Encontrou alguém que combina? É só chamar. Nada de esperar a outra pessoa curtir de volta.">
          <div className="art-chat">
            <span className="bubble is-them b1">A vaga ainda está livre?</span>
            <span className="bubble is-me b2">Está! Quer visitar?</span>
            <span className="chat-last">
              <span className="bubble is-them typing"><i /><i /><i /></span>
              <span className="bubble is-them b3">Sábado às 10h?</span>
            </span>
          </div>
        </Card>

        <Card className="b-small" i={3} title="Avaliações de convívio" text="Quem já morou junto pode se avaliar. Você vê como a pessoa é como colega de casa antes de decidir.">
          <div className="art-rate">
            <span className="art-stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="star" style={d(i)}><Star className="star-bg" /><Star className="star-fill" /></span>
              ))}
            </span>
            <span className="rate-quote">“Divide as contas certinho e respeita o silêncio.”</span>
            <span className="rate-tag">exemplo</span>
          </div>
        </Card>

        <Card className="b-small" i={4} title="Um CPF por conta" text="Cada pessoa tem uma conta só, o que dificulta perfil falso. O CPF não aparece no seu perfil.">
          <div className="art-cpf">
            <svg viewBox="0 0 48 48" className="cpf-shield">
              <path className="cpf-body" d="M24 4 8 10v12c0 10.5 6.8 18.7 16 22 9.2-3.3 16-11.5 16-22V10L24 4z" />
              <path className="cpf-check" d="m16.5 24.5 5.2 5.2L32 19.4" pathLength="1" />
            </svg>
            <span className="cpf-mask">•••.•••.•••-12</span>
          </div>
        </Card>

        <Card className="b-small" i={5} title="Vagas por sexo" text="Quem anuncia pode aceitar só mulheres ou só homens, e a vaga nem aparece para quem não pode se candidatar.">
          <div className="art-seg">
            <div className="art-segment"><span>Qualquer</span><span>Mulheres</span><span>Homens</span><i /></div>
            <ul className="seg-list">
              <li className="is-any">Quarto · qualquer pessoa</li>
              <li className="is-f">Vaga · só mulheres</li>
              <li className="is-m">Suíte · só homens</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
