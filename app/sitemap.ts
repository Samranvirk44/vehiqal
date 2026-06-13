import { MetadataRoute } from 'next'
import { absoluteUrl, citySlug, SERVICE_AREAS } from '@/lib/seo'

export const revalidate = 300

const IMPORTANT_PAGES = [
  { path:'/', changeFrequency:'daily', priority:1 },
  { path:'/cars', changeFrequency:'hourly', priority:0.9 },
  { path:'/sell', changeFrequency:'weekly', priority:0.8 },
  { path:'/about', changeFrequency:'monthly', priority:0.7 },
  { path:'/contact', changeFrequency:'monthly', priority:0.75 },
  { path:'/reviews', changeFrequency:'monthly', priority:0.65 },
  { path:'/privacy', changeFrequency:'yearly', priority:0.4 },
  { path:'/terms', changeFrequency:'yearly', priority:0.4 },
] as const

type SitemapCar = {
  id: string
  isTrusted: boolean
  image?: string
  updatedAt?: Date
}

function toDate(value: unknown) {
  if (!value) return undefined
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

async function getSitemapCars(): Promise<SitemapCar[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!projectId || !apiKey) return []

  const cars: SitemapCar[] = []
  let pageToken = ''

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/cars`
    )
    url.searchParams.set('pageSize', '100')
    url.searchParams.set('key', apiKey)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const response = await fetch(url, { next:{ revalidate } })
    if (!response.ok) throw new Error(`Firestore sitemap request failed: ${response.status}`)

    const data = await response.json() as {
      documents?: Array<{
        name: string
        updateTime?: string
        fields?: {
          status?: { stringValue?: string }
          isTrusted?: { booleanValue?: boolean }
          images?: { arrayValue?: { values?: Array<{ stringValue?: string }> } }
        }
      }>
      nextPageToken?: string
    }

    for (const document of data.documents ?? []) {
      const status = document.fields?.status?.stringValue
      if (status && status !== 'active') continue

      cars.push({
        id:document.name.split('/').pop() ?? '',
        isTrusted:Boolean(document.fields?.isTrusted?.booleanValue),
        image:document.fields?.images?.arrayValue?.values?.[0]?.stringValue,
        updatedAt:toDate(document.updateTime),
      })
    }

    pageToken = data.nextPageToken ?? ''
  } while (pageToken)

  return cars.filter(car => car.id)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let carUrls: MetadataRoute.Sitemap = []

  try {
    const cars = await getSitemapCars()
    carUrls = cars.map(car => ({
      url:absoluteUrl(`/cars/${car.id}`),
      lastModified:car.updatedAt,
      changeFrequency:'daily' as const,
      priority:car.isTrusted ? 0.82 : 0.72,
      images:car.image ? [car.image] : undefined,
    }))
  } catch {
    carUrls = []
  }

  const staticUrls = [
    ...IMPORTANT_PAGES.map(page => ({
      url:absoluteUrl(page.path),
      changeFrequency:page.changeFrequency,
      priority:page.priority,
    })),
    ...SERVICE_AREAS.flatMap(city => [
      { url:absoluteUrl(`/cars-for-sale-${citySlug(city)}`), changeFrequency:'daily' as const, priority:0.85 },
      { url:absoluteUrl(`/sell-car-${citySlug(city)}`), changeFrequency:'monthly' as const, priority:0.7 },
    ]),
  ]
  return [...staticUrls, ...carUrls]
}
