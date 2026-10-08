const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "12345678901" → "123.456.789-01" (enquanto digita: formata o que já tem). */
export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatMoney(value: number) {
  return currency.format(value)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** "2 homens e 1 mulher já moram lá" — null quando os dois campos não foram informados. */
export function formatResidents(male: number | null, female: number | null): string | null {
  if (male == null && female == null) return null
  const m = male ?? 0
  const f = female ?? 0
  const total = m + f
  if (total === 0) return 'Ninguém mora lá ainda'
  const parts: string[] = []
  if (m > 0) parts.push(`${m} ${m === 1 ? 'homem' : 'homens'}`)
  if (f > 0) parts.push(`${f} ${f === 1 ? 'mulher' : 'mulheres'}`)
  return `${parts.join(' e ')} já ${total === 1 ? 'mora' : 'moram'} lá`
}
