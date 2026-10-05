// Textos e dados de exemplo da landing pública. Ficam aqui para os componentes cuidarem
// só do layout. Vocabulário: ver .agents/product-marketing.md (evitar "match", "verificado").
import type { LandingMode } from '../../landing3d/Landing3D'

export const modes: Array<{ id: LandingMode; label: string }> = [
  { id: 'procurar', label: 'Procuro vaga' },
  { id: 'anunciar', label: 'Tenho vaga' },
]

/** Título do topo: uma parte fixa e uma palavra que vai trocando sozinha. */
export const hero: Record<LandingMode, { lead: string; words: string[]; text: string; cta: string }> = {
  procurar: {
    lead: 'Ache quem combina',
    words: ['com a sua rotina.', 'com o seu pet.', 'com o seu horário.', 'com o seu bolso.'],
    text: 'Monte seu perfil de convivência e veja, em cada anúncio, o quanto você combina com quem já mora lá. Sem garimpar grupo de WhatsApp.',
    cta: 'Criar conta grátis',
  },
  anunciar: {
    lead: 'Um colega que combina',
    words: ['com a casa.', 'com as regras.', 'com a sua rotina.', 'com você.'],
    text: 'Publique o quarto ou o imóvel com fotos e veja a compatibilidade de cada interessado antes de responder. Os 3 primeiros anúncios são grátis.',
    cta: 'Anunciar grátis',
  },
}

export const promises = ['Grátis para quem procura', '3 anúncios grátis para quem anuncia', 'Feito para Maringá']

// ---------- demonstração de compatibilidade ("Experimente") ----------
export type HabitId = 'fuma' | 'pet' | 'cedo' | 'visitas'
export const habits: Array<{ id: HabitId; label: string; weight: number }> = [
  { id: 'fuma', label: 'Eu fumo', weight: 30 },
  { id: 'pet', label: 'Tenho pet', weight: 25 },
  { id: 'cedo', label: 'Durmo cedo', weight: 25 },
  { id: 'visitas', label: 'Recebo visitas', weight: 20 },
]

export interface DemoListing {
  id: string
  title: string
  price: string
  /** como a casa é / o que ela aceita */
  house: Record<HabitId, boolean>
  tags: string[]
}

export const demoListings: DemoListing[] = [
  { id: 'a', title: 'Quarto na Zona 7', price: 'R$ 650', house: { fuma: false, pet: true, cedo: true, visitas: false }, tags: ['tem um gato', 'casa silenciosa'] },
  { id: 'b', title: 'Vaga perto da UEM', price: 'R$ 520', house: { fuma: false, pet: false, cedo: false, visitas: true }, tags: ['sem pets', 'movimentada'] },
  { id: 'c', title: 'Suíte no Centro', price: 'R$ 800', house: { fuma: true, pet: false, cedo: true, visitas: false }, tags: ['aceita fumante', 'rotina de dia'] },
  { id: 'd', title: 'República no Jd. Universitário', price: 'R$ 450', house: { fuma: true, pet: true, cedo: false, visitas: true }, tags: ['liberada', 'pet ok'] },
]

/** Conta simplificada (a real usa mais hábitos): soma o peso de cada hábito que não conflita. */
export function demoScore(me: Record<HabitId, boolean>, l: DemoListing) {
  const ok: Record<HabitId, boolean> = {
    fuma: !me.fuma || l.house.fuma,
    pet: !me.pet || l.house.pet,
    cedo: me.cedo === l.house.cedo,
    visitas: !me.visitas || l.house.visitas,
  }
  return habits.reduce((sum, h) => sum + (ok[h.id] ? h.weight : 0), 0)
}

// ---------- como funciona ----------
export interface Step { title: string; text: string; short: string; details: string[] }
export const steps: Record<LandingMode, { title: string; items: Step[] }> = {
  procurar: {
    title: 'Do perfil à mudança, em 3 passos',
    items: [
      { title: 'Conte como você vive', short: 'Perfil', text: 'Fuma? Tem pet? Dorme cedo? Você responde uma vez e pronto.',
        details: ['Fumo, bebida e alimentação', 'Pets, rotina e barulho', 'Visitas e convivência'] },
      { title: 'Veja quem combina', short: 'Compatibilidade', text: 'Cada anúncio mostra a % de compatibilidade com quem mora lá, e a busca já vem ordenada por ela.',
        details: ['Busca ordenada pela % de compatibilidade', 'Filtro por bairro, mapa e orçamento', 'Vagas só para mulheres ou só para homens'] },
      { title: 'Chame direto', short: 'Conversa', text: 'Gostou? Abre o chat e combina a visita. Sem curtida e sem fila de espera.',
        details: ['Chat direto, sem precisar de curtida', 'Bloqueio e denúncia em qualquer conversa', 'Avaliações de quem já morou junto'] },
    ],
  },
  anunciar: {
    title: 'Da vaga vazia ao novo colega, em 3 passos',
    items: [
      { title: 'Publique a vaga', short: 'Anúncio', text: 'Fotos, valor, bairro e as regras da casa. Leva poucos minutos.',
        details: ['Vaga para dividir ou imóvel inteiro', 'Fotos, valor e regras da casa', '3 anúncios ativos grátis'] },
      { title: 'Receba interessados', short: 'Interessados', text: 'Cada pessoa chega com a % de compatibilidade com você ao lado do nome.',
        details: ['A % de cada interessado ao lado do nome', 'Perfil com os hábitos de convivência', 'Avaliações de quem já morou com a pessoa'] },
      { title: 'Escolha com calma', short: 'Conversa', text: 'Converse primeiro com quem mais combina e feche com quem você aguenta morar junto.',
        details: ['Converse primeiro com quem combina mais', 'Bloqueio e denúncia sempre à mão', 'Destaque no topo da busca, se quiser'] },
    ],
  },
}

// ---------- dúvidas ----------
export const faq: Array<{ q: string; a: string }> = [
  {
    q: 'Quanto custa?',
    a: 'Procurar vaga é grátis, sempre. Quem anuncia tem os primeiros anúncios ativos de graça e só paga se quiser publicar mais ou colocar um anúncio em destaque. Não tem mensalidade.',
  },
  {
    q: 'Como a compatibilidade é calculada?',
    a: 'Pelos hábitos que cada pessoa marca no perfil: fumo, bebida, alimentação, pets, rotina, barulho e visitas. Quanto mais coisas batem, maior a porcentagem. Ela serve para filtrar; a decisão continua sendo sua.',
  },
  {
    q: 'É seguro falar com desconhecidos aqui?',
    a: 'O cadastro pede CPF (uma conta por pessoa), existem avaliações de quem já morou junto e qualquer conversa tem bloqueio e denúncia. Mesmo assim, visite o lugar antes de pagar qualquer coisa e nunca adiante dinheiro para quem você não conheceu.',
  },
  {
    q: 'Posso procurar e anunciar com a mesma conta?',
    a: 'Pode. No cadastro você escolhe por onde começar e ativa a outra opção depois, direto no seu perfil.',
  },
  {
    q: 'Funciona fora de Maringá?',
    a: 'Por enquanto o RachaAi é feito para Maringá: bairros, mapa e faculdades da cidade. Outras cidades vêm depois.',
  },
  {
    q: 'Como eu pago um anúncio extra ou um destaque?',
    a: 'Pelo Mercado Pago, com Pix, cartão de crédito ou débito. O número do cartão fica com o Mercado Pago, não passa pelo RachaAi.',
  },
]
