const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatMoney(value: number) {
  return currency.format(value)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
