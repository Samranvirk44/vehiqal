import type { Metadata } from 'next'

export const SITE_NAME = 'Vehiqal'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vehiqal.com'
export const CONTACT_PHONE_DISPLAY = '0303 4642619'
export const CONTACT_PHONE_TEL = '+923034642619'
export const CONTACT_WHATSAPP = '923034642619'
export const CONTACT_EMAIL = 'info@vehiqal.com'
export const GOOGLE_BUSINESS_URL = process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || ''
export const FACEBOOK_URL = 'https://www.facebook.com/share/1EDrWp5oRn/?mibextid=wwXIfr'
export const SERVICE_AREAS = [
  'Gujranwala',
  'Lahore',
  'Sialkot',
  'Gujrat',
  'Sheikhupura',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Peshawar',
  'Multan',
  'Quetta',
]

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

export function jsonLdGraph(items: Array<Record<string, any>>) {
  return {
    '@context':'https://schema.org',
    '@graph':items.filter(Boolean),
  }
}

export function businessJsonLd() {
  return {
    '@type':['AutoDealer','LocalBusiness'],
    '@id':absoluteUrl('/#business'),
    name:SITE_NAME,
    url:absoluteUrl('/'),
    telephone:CONTACT_PHONE_TEL,
    email:CONTACT_EMAIL,
    priceRange:'PKR',
    image:absoluteUrl('/opengraph-image'),
    logo:absoluteUrl('/icon'),
    slogan:'We take your headache.',
    description:'Vehiqal helps buyers and sellers in Pakistan with inspected used cars, verified listings, 300-point vehicle checks, and safer car deal support.',
    areaServed:SERVICE_AREAS.map(city => ({ '@type':'City', name:city })),
    contactPoint:[
      {
        '@type':'ContactPoint',
        telephone:CONTACT_PHONE_TEL,
        contactType:'customer support',
        areaServed:'PK',
        availableLanguage:['English','Urdu','Punjabi'],
      },
    ],
    openingHoursSpecification:[
      {
        '@type':'OpeningHoursSpecification',
        dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        opens:'09:00',
        closes:'19:00',
      },
    ],
    sameAs:[FACEBOOK_URL, ...(GOOGLE_BUSINESS_URL ? [GOOGLE_BUSINESS_URL] : [])],
  }
}

export function websiteJsonLd() {
  return {
    '@type':'WebSite',
    '@id':absoluteUrl('/#website'),
    name:SITE_NAME,
    url:absoluteUrl('/'),
    publisher:{ '@id':absoluteUrl('/#business') },
    potentialAction:{
      '@type':'SearchAction',
      target:`${absoluteUrl('/cars')}?make={search_term_string}`,
      'query-input':'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@type':'BreadcrumbList',
    itemListElement:items.map((item, index) => ({
      '@type':'ListItem',
      position:index + 1,
      name:item.name,
      item:absoluteUrl(item.path),
    })),
  }
}

export function carsCollectionJsonLd({
  title,
  description,
  path,
  city,
}: {
  title: string
  description: string
  path: string
  city?: string
}) {
  return {
    '@type':'CollectionPage',
    '@id':`${absoluteUrl(path)}#collection`,
    name:title,
    description,
    url:absoluteUrl(path),
    isPartOf:{ '@id':absoluteUrl('/#website') },
    about:[
      { '@type':'Thing', name:'Used cars' },
      { '@type':'Thing', name:'Inspected cars' },
      ...(city ? [{ '@type':'City', name:city }] : []),
    ],
  }
}

export function cityFaqJsonLd(city: string) {
  return {
    '@type':'FAQPage',
    '@id':`${absoluteUrl(`/cars-for-sale-${citySlug(city)}`)}#faq`,
    mainEntity:[
      {
        '@type':'Question',
        name:`Can I buy inspected used cars in ${city} on Vehiqal?`,
        acceptedAnswer:{
          '@type':'Answer',
          text:`Yes. Vehiqal lists used cars in ${city}, and inspected cars appear first with vehicle health information and Vehiqal deal support.`,
        },
      },
      {
        '@type':'Question',
        name:`Does Vehiqal help with car payment and handover in ${city}?`,
        acceptedAnswer:{
          '@type':'Answer',
          text:`For inspected cars, Vehiqal helps manage the deal process, buyer-seller coordination, payment support, and handover guidance.`,
        },
      },
      {
        '@type':'Question',
        name:`How do I sell my car in ${city}?`,
        acceptedAnswer:{
          '@type':'Answer',
          text:`You can list your car for free on Vehiqal, add photos and contact details, and request inspection if you want the car to appear as inspected.`,
        },
      },
    ],
  }
}
