/**
 * Compara nomes de lugar como o servidor compara (DiscoveryService.normalizeLocation), e um pouco
 * mais tolerante: "Zona 07" = "zona 7", "Jardim Universitário" = "jardim universitario".
 */
export const normalizePlace = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/(?<![0-9])0+(?=[0-9])/g, '').replace(/\s+/g, ' ').trim()
