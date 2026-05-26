import { MetadataRoute } from 'next'
import { getCars } from '@/lib/cars'
import { absoluteUrl, citySlug, SERVICE_AREAS } from '@/lib/seo'

function toDate(value: any) {
  if (!value) return new Date()
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updatedAt = new Date()
  let carUrls: MetadataRoute.Sitemap = []

  try {
    const cars = await getCars({ pageLimit: 100 })
    carUrls = cars.map(car => ({
      url:absoluteUrl(`/cars/${car.id}`),
      lastModified:toDate(car.createdAt),
      changeFrequency:'daily' as const,
      priority:car.isTrusted ? 0.82 : 0.72,
      images:car.images?.[0] ? [car.images[0]] : undefined,
    }))
  } catch {
    carUrls = []
  }

  const staticUrls = [
    { url:absoluteUrl('/'), lastModified:updatedAt, changeFrequency:'daily' as const, priority:1 },
    { url:absoluteUrl('/cars'), lastModified:updatedAt, changeFrequency:'hourly' as const, priority:0.9 },
    { url:absoluteUrl('/sell'), lastModified:updatedAt, changeFrequency:'weekly' as const, priority:0.8 },
    { url:absoluteUrl('/about'), lastModified:updatedAt, changeFrequency:'monthly' as const, priority:0.7 },
    { url:absoluteUrl('/contact'), lastModified:updatedAt, changeFrequency:'monthly' as const, priority:0.75 },
    { url:absoluteUrl('/reviews'), lastModified:updatedAt, changeFrequency:'monthly' as const, priority:0.65 },
    { url:absoluteUrl('/privacy'), lastModified:updatedAt, changeFrequency:'yearly' as const, priority:0.4 },
    { url:absoluteUrl('/terms'), lastModified:updatedAt, changeFrequency:'yearly' as const, priority:0.4 },
    ...SERVICE_AREAS.flatMap(city => [
      { url:absoluteUrl(`/cars-for-sale-${citySlug(city)}`), lastModified:updatedAt, changeFrequency:'daily' as const, priority:0.85 },
      { url:absoluteUrl(`/sell-car-${citySlug(city)}`), lastModified:updatedAt, changeFrequency:'monthly' as const, priority:0.7 },
    ]),
  ]
  return [...staticUrls, ...carUrls]
}
