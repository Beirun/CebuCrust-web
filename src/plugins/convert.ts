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

export function base64ToFile(b64: string, name: string) {
  try {
    if (!b64.includes(',')) throw new Error('invalid data url')
    const [meta, data] = b64.split(',')
    const m = meta.match(/data:(.*?);base64/)
    if (!m) throw new Error('invalid mime')
    const mime = m[1]
    const bin = atob(data)
    const len = bin.length
    const arr = new Uint8Array(len)
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i)
    return new File([arr], name, { type: mime })
  } catch (e) {
    console.error(e)
    return null
  }
}
