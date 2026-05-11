import { useEffect } from 'react'

export const SITE_URL = 'https://happybags.co.ke'
export const SITE_NAME = 'HappyBags Kenya'
export const DEFAULT_OG_IMAGE = '/og-image.png'

export const defaultDescription = 'Shop quality bags and packaging supplies in Kenya. Find non-woven bags, gift bags, tote bags, khaki bags, cups, plates, straws and more from HappyBags Kenya.'

export function absoluteUrl(value = '/') {
  if (!value) return SITE_URL + '/'
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value, SITE_URL).toString()
}

export function truncateText(value, max = 155) {
  if (!value) return ''
  const clean = String(value).replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 3).trim() + '...' : clean
}

function upsertMeta(attribute, key, content) {
  if (!content) return

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function setJsonLd(jsonLdText) {
  const id = 'structured-data'
  const existing = document.getElementById(id)

  if (!jsonLdText) {
    existing?.remove()
    return
  }

  const script = existing || document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = jsonLdText

  if (!existing) document.head.appendChild(script)
}

export default function SEO({
  title = 'HappyBags Kenya | Bags and Packaging in Nairobi',
  description = defaultDescription,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  robots = 'index, follow',
  jsonLd,
}) {
  const canonicalUrl = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)
  const safeDescription = truncateText(description, 160)
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    document.title = title

    setCanonical(canonicalUrl)
    upsertMeta('name', 'description', safeDescription)
    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', safeDescription)
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'en_KE')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', safeDescription)
    upsertMeta('name', 'twitter:image', imageUrl)
    setJsonLd(jsonLdText)
  }, [canonicalUrl, imageUrl, jsonLdText, robots, safeDescription, title, type])

  return null
}
