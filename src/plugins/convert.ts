export const toBase64 = (string: string) => {
  return `data:image/png;base64,${string}`
}

export function toDate(iso: string | Date): string {
  if (!iso) return ''
  const d = typeof iso === 'object' ? new Date(iso) : new Date(iso)
  if (isNaN(d.getTime())) return ''

  // manually add 8 hours
  const manilaTime = new Date(d.getTime() + 8 * 60 * 60 * 1000)

  const hours = manilaTime.getHours() % 12 || 12
  const minutes = manilaTime.getMinutes().toString().padStart(2, '0')
  const ampm = manilaTime.getHours() >= 12 ? 'PM' : 'AM'

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const dateStr = `${monthNames[manilaTime.getMonth()]} ${manilaTime.getDate()}, ${manilaTime.getFullYear()}`

  return `${dateStr}, ${hours}:${minutes} ${ampm}`
}
