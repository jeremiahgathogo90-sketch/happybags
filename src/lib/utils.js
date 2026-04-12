export function formatKES(amount) {
  if (amount == null) return 'KSh -'
  return 'KSh ' + Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function discountPct(original, current) {
  if (!original || original <= current) return 0
  return Math.round(((original - current) / original) * 100)
}

export function truncate(text, maxLen = 60) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

export function timeRemaining(endsAt) {
  const diff = new Date(endsAt) - new Date()
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { hours, minutes, seconds, expired: false }
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function storageUrl(bucket, path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_SUPABASE_URL
  return base + '/storage/v1/object/public/' + bucket + '/' + path
}