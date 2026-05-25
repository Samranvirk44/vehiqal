import { MetadataRoute } from 'next'
import { absoluteUrl, citySlug } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = new Date()
  const cities = ['Gujranwala','Lahore','Sialkot','Gujrat','Sheikhupura','Karachi','Islamabad','Rawalpindi','Faisalabad','Peshawar','Multan','Quetta']
  const staticUrls = [
    { url:absoluteUrl('/'), lastModified:updatedAt, changeFrequency:'daily' as const, priority:1 },
    { url:absoluteUrl('/cars'), lastModified:updatedAt, changeFrequency:'hourly' as const, priority:0.9 },
    { url:absoluteUrl('/sell'), lastModified:updatedAt, changeFrequency:'weekly' as const, priority:0.8 },
    ...cities.flatMap(city => [
      { url:absoluteUrl(`/cars-for-sale-${citySlug(city)}`), lastModified:updatedAt, changeFrequency:'daily' as const, priority:0.85 },
      { url:absoluteUrl(`/sell-car-${citySlug(city)}`), lastModified:updatedAt, changeFrequency:'monthly' as const, priority:0.7 },
    ]),
  ]
  return staticUrls
}
