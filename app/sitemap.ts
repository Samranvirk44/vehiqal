import { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const cities = ['gujranwala','lahore','sialkot','gujrat','sheikhupura','karachi','islamabad','rawalpindi','faisalabad','peshawar','multan','quetta']
  const staticUrls = [
    { url:'https://vehiqal.com',    lastModified:new Date(), changeFrequency:'daily' as const, priority:1 },
    { url:'https://vehiqal.com/cars', lastModified:new Date(), changeFrequency:'hourly' as const, priority:0.9 },
    { url:'https://vehiqal.com/sell', lastModified:new Date(), changeFrequency:'monthly' as const, priority:0.8 },
    ...cities.flatMap(city => [
      { url:`https://vehiqal.com/cars-for-sale-${city}`, lastModified:new Date(), changeFrequency:'daily' as const, priority:0.9 },
      { url:`https://vehiqal.com/sell-car-${city}`, lastModified:new Date(), changeFrequency:'monthly' as const, priority:0.7 },
    ]),
  ]
  return staticUrls
}
