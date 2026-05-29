import type { Metadata } from 'next'
import { CarDetailClient } from './CarDetailClient'
import { formatPrice, getCarById } from '@/lib/cars'
import { CONTACT_PHONE_DISPLAY, pageMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const car = await getCarById(params.id)

  if (!car || car.status === 'removed') {
    return pageMeta({
      title:'Car Not Found - Vehiqal',
      description:'This car listing may have been removed. Browse available inspected used cars on Vehiqal.',
      path:`/cars/${params.id}`,
      noIndex:true,
    })
  }

  const title = `${car.make} ${car.model} ${car.year} for Sale in ${car.city}`
  const mileage = Number(car.mileage) > 0 ? `, ${Number(car.mileage).toLocaleString()} km` : ''
  const inspected = car.isTrusted ? ' Inspected by Vehiqal.' : ''
  const registered = car.registeredLocation ? ` Registered in ${car.registeredLocation}.` : ''
  const registeredKeywords = car.registeredLocation ? [`${car.registeredLocation} registered car`] : []

  return pageMeta({
    title,
    description:`${car.year} ${car.make} ${car.model} in ${car.city}. ${formatPrice(car.price)}${mileage}.${registered}${inspected} Call ${CONTACT_PHONE_DISPLAY}.`,
    path:`/cars/${params.id}`,
    image:car.images?.[0] || '/opengraph-image',
    keywords:[car.make, car.model, `${car.make} ${car.model}`, `used cars ${car.city}`, `cars for sale ${car.city}`, ...registeredKeywords],
    noIndex:car.status === 'sold',
  })
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  return <CarDetailClient id={params.id} />
}
