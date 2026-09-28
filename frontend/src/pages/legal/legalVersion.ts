// Dados usados nos Termos de Uso e na Política de Privacidade. Preencha tudo que está entre
// colchetes ANTES de publicar o site, e peça para um advogado revisar os textos.
//
// A versão precisa ser a mesma de backend/.../user/LegalTerms.java: ao mudar o texto de um jeito
// relevante, troque a data nos dois lugares e todo mundo vai precisar aceitar de novo.

export const LEGAL_VERSION = '2026-09-28'
export const LEGAL_VERSION_LABEL = '28 de setembro de 2026'

export const LEGAL = {
  /** Quem responde pelo site: nome completo (pessoa física) ou razão social (empresa). */
  controllerName: '[NOME OU RAZÃO SOCIAL DO RESPONSÁVEL]',
  /** CPF ou CNPJ do responsável. */
  controllerDocument: '[CPF OU CNPJ]',
  /** Endereço para correspondência. */
  controllerAddress: '[ENDEREÇO COMPLETO]',
  /** E-mail do encarregado de dados (DPO), para pedidos de titulares. */
  privacyEmail: '[E-MAIL DE PRIVACIDADE, ex.: privacidade@seudominio.com.br]',
  /** E-mail de atendimento geral. */
  supportEmail: '[E-MAIL DE SUPORTE, ex.: contato@seudominio.com.br]',
  /** Cidade do foro. */
  forumCity: '[CIDADE - UF, ex.: Maringá - PR]',
  /** Por quanto tempo denúncias ficam guardadas depois de fechadas. */
  reportRetention: '5 (cinco) anos',
}
