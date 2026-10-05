import { Bell, Camera, Check, MapPin, Search, Send } from 'lucide-react'
import type { LandingMode } from '../../../landing3d/Landing3D'

// Celular como objeto 3D feito só com CSS (preserve-3d): frente com a tela, verso, quatro
// laterais retas e "fatias" arredondadas empilhadas na espessura (fazem os cantos curvos
// terem volume), botões laterais, reflexo no vidro e cartões que saem da tela.
// Este componente só monta o DOM; quem mexe nele é o engine.ts (carregado depois),
// escrevendo transform/opacity direto nos elementos marcados com data-*.

export type PhoneScreen = 'home' | 'habits' | 'list' | 'chat'

const rows: Record<LandingMode, Array<[string, number]>> = {
  procurar: [['Quarto na Zona 7', 92], ['Suíte no Centro', 78], ['Vaga perto da UEM', 55]],
  anunciar: [['Marina, 21', 92], ['João, 23', 78], ['Ana, 20', 64]],
}

function Row({ name, score, attr }: { name: string; score: number; attr: Record<string, number> }) {
  return (
    <div className="p3-row" {...Object.fromEntries(Object.entries(attr).map(([k, v]) => [`data-${k}`, v]))}>
      <span className="p3-avatar">{name[0]}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <b className={score >= 75 ? 'text-leaf' : 'text-mel'}>{score}%</b>
    </div>
  )
}

function Screens({ mode }: { mode: LandingMode }) {
  const procurar = mode === 'procurar'
  const chat = procurar
    ? [['me', 'Oi! A vaga ainda está livre?'], ['them', 'Está sim! Quer visitar no sábado?'], ['me', 'Fechado, 10h tá bom?']]
    : [['them', 'Oi! A vaga ainda está livre?'], ['me', 'Está sim! Quer visitar no sábado?'], ['them', 'Fechado, 10h tá bom?']]
  return (
    <>
      <div className="p3-screen" data-screen="home">
        <p className="p3-hello">{procurar ? 'Oi! Bora achar sua vaga?' : 'Oi! Bora achar seu colega?'}</p>
        <span className="p3-search"><Search className="h-3.5 w-3.5" />{procurar ? 'Buscar em Maringá' : 'Seus anúncios'}</span>
        <span className="flex flex-wrap gap-1.5">
          {['Zona 7', 'Centro', 'Jd. Universitário'].map((b) => <span key={b} className="p3-pill">{b}</span>)}
        </span>
        <div className="p3-feature">
          <span className="p3-feature-img" />
          <span className="p3-feature-txt"><b>{rows[mode][0][0]}</b><span><MapPin className="h-3 w-3" /> Maringá</span></span>
        </div>
      </div>

      <div className="p3-screen" data-screen="habits">
        {procurar ? (
          <>
            <p className="p3-title">Seu jeito de morar</p>
            {['Não fumo', 'Tenho um gato', 'Durmo cedo', 'Visitas às vezes', 'Cozinho em casa'].map((t, i) => (
              <span key={t} className="p3-pick">
                <span className="p3-check" data-check={i}><Check className="h-3 w-3" /></span>{t}
              </span>
            ))}
          </>
        ) : (
          <>
            <p className="p3-title">Nova vaga</p>
            <div className="p3-photo"><Camera className="h-6 w-6" /></div>
            {['Quarto na Zona 7', 'R$ 650 / mês', 'Aceita pet', 'Casa silenciosa'].map((t, i) => (
              <span key={t} className="p3-pick">
                <span className="p3-check" data-check={i}><Check className="h-3 w-3" /></span>{t}
              </span>
            ))}
          </>
        )}
      </div>

      <div className="p3-screen" data-screen="list">
        <p className="p3-title">{procurar ? 'Vagas para você' : 'Interessados'}</p>
        {rows[mode].map(([n, s], i) => <Row key={n} name={n} score={s} attr={{ row: i }} />)}
        <p className="p3-hint">ordenado por compatibilidade</p>
      </div>

      <div className="p3-screen" data-screen="chat">
        <p className="p3-title">{procurar ? 'Marina' : 'João'}</p>
        {chat.map(([who, t], i) => <span key={t} className={`p3-msg is-${who}`} data-bubble={i}>{t}</span>)}
        <span className="p3-input">Mensagem <Send className="h-3.5 w-3.5" /></span>
      </div>

      <div className="p3-notif" data-notif>
        <span className="p3-notif-icon"><Bell className="h-3.5 w-3.5" /></span>
        <span className="min-w-0"><b>RachaAi</b><span className="block truncate">{procurar ? 'Marina: Posso visitar no sábado?' : 'João quer visitar sua vaga'}</span></span>
      </div>
    </>
  )
}

/** `slices`: camadas da espessura (completo 9, leve 3). `cards`: cartões que orbitam. */
export default function Phone3D({ mode, slices = 9, cards = true, screen }: { mode: LandingMode; slices?: number; cards?: boolean; screen?: PhoneScreen }) {
  const z = Array.from({ length: slices }, (_, i) => (slices === 1 ? 0 : -7 + (14 * i) / (slices - 1)))
  return (
    <div className="p3-root" data-phone data-static-screen={screen}>
      {z.map((v, i) => <span key={i} className="p3-slice" style={{ transform: `translateZ(${v}px)` }} data-mid={Math.abs(v) < 3 ? '' : undefined} />)}
      <span className="p3-side is-left"><i className="p3-btn" style={{ top: 96 }} /><i className="p3-btn" style={{ top: 150, height: 44 }} /></span>
      <span className="p3-side is-right"><i className="p3-btn" style={{ top: 130, height: 70 }} /></span>
      <span className="p3-side is-top" />
      <span className="p3-side is-bottom" />
      <span className="p3-back"><i className="p3-cam" /><i className="p3-cam is-2" /></span>
      <div className="p3-front">
        <div className="p3-glass">
          <span className="p3-island" />
          <Screens mode={mode} />
          <span className="p3-glare" data-glare />
        </div>
      </div>
      {cards && rows[mode].map(([n, s], i) => (
        <div key={n} className="p3-card" data-card={i}><Row name={n} score={s} attr={{}} /></div>
      ))}
    </div>
  )
}
