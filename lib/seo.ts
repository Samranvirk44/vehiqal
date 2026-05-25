import type { Metadata } from 'next'

export const SITE_NAME = 'Vehiqal'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vehiqal.com'
export const CONTACT_PHONE_DISPLAY = '0303 4642619'
export const CONTACT_PHONE_TEL = '+923034642619'
export const CONTACT_WHATSAPP = '923034642619'
export const CONTACT_EMAIL = 'info@vehiqal.com'

export const coreKeywords = [
  'used cars Pakistan',
  'verified used cars',
  'inspected cars Pakistan',
  'buy car Pakistan',
  'sell car Pakistan',
  'car marketplace Pakistan',
  'Vehiqal',
]

export function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL.replace(/\/$/, '')}${normalizedPath}`
}

export function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-')
}

export function pageMeta({
  title,
  description,
  path,
  keywords = [],
  image = '/opengraph-image',
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
}): Metadata {
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)

  return {
    title,
    description,
    keywords:[...coreKeywords, ...keywords],
    alternates:{ canonical:url },
    openGraph:{
      title,
      description,
      url,
      siteName:SITE_NAME,
      locale:'en_PK',
      type:'website',
      images:[{ url:imageUrl, width:1200, height:630, alt:`${SITE_NAME} - inspected car deals` }],
    },
    twitter:{
      card:'summary_large_image',
      title,
      description,
      images:[imageUrl],
    },
    robots:noIndex
      ? { index:false, follow:false, nocache:true, googleBot:{ index:false, follow:false, noimageindex:true } }
      : { index:true, follow:true, googleBot:{ index:true, follow:true, 'max-image-preview':'large', 'max-snippet':-1, 'max-video-preview':-1 } },
  }
}

export function cityCarsMeta(city: string) {
  return pageMeta({
    title:`Used Cars for Sale in ${city} - Inspected Listings`,
    description:`Browse used cars for sale in ${city}. Vehiqal inspected cars come with 300-point checks, payment support, and car deal assistance. Call ${CONTACT_PHONE_DISPLAY}.`,
    path:`/cars-for-sale-${citySlug(city)}`,
    keywords:[`used cars ${city}`, `cars for sale ${city}`, `inspected cars ${city}`, `buy car ${city}`],
  })
}

export function sellCityMeta(city: string) {
  return pageMeta({
    title:`Sell Your Car in ${city} - Free Listing`,
    description:`Sell your car in ${city} with Vehiqal. List free, reach verified buyers, request inspection, and get support for a safer deal. Call ${CONTACT_PHONE_DISPLAY}.`,
    path:`/sell-car-${citySlug(city)}`,
    keywords:[`sell car ${city}`, `car buyers ${city}`, `list car ${city}`, `sell used car ${city}`],
  })
}
