import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CityCarsPage } from '@/components/CityCarsPage'
import { SellForm } from '@/app/sell/SellForm'

const CITIES = [
  'Gujranwala','Lahore','Sialkot','Gujrat','Sheikhupura',
  'Karachi','Islamabad','Rawalpindi','Faisalabad','Peshawar','Multan','Quetta',
]

const cityBySlug = Object.fromEntries(
  CITIES.map(city => [city.toLowerCase().replace(/\s+/g, '-'), city])
)

function cityFromSlug(slug: string, prefix: string) {
  if (!slug.startsWith(prefix)) return null
  return cityBySlug[slug.slice(prefix.length)] ?? null
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const carsCity = cityFromSlug(params.slug, 'cars-for-sale-')
  if (carsCity) {
    return {
      title: `Used Cars for Sale in ${carsCity} - Vehiqal`,
      description: `Browse verified used cars in ${carsCity}. 300-point inspections. Payment guaranteed. Call 0311 4642679.`,
    }
  }

  const sellCity = cityFromSlug(params.slug, 'sell-car-')
  if (sellCity) {
    return {
      title: `Sell Your Car in ${sellCity} - Free on Vehiqal`,
      description: `Sell your car in ${sellCity} safely. Free listing, verified buyers, payment guaranteed. Call 0311 4642679.`,
    }
  }

  return {}
}

export default async function CityRoutePage({ params }: { params: { slug: string } }) {
  const carsCity = cityFromSlug(params.slug, 'cars-for-sale-')
  if (carsCity) {
    return <CityCarsPage city={carsCity} />
  }

  const sellCity = cityFromSlug(params.slug, 'sell-car-')
  if (sellCity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Sell Your Car in {sellCity}</h1>
          <p className="text-gray-500 text-lg">Free listing · Verified buyers · Payment guaranteed</p>
        </div>
        <SellForm />
      </div>
    )
  }

  notFound()
}
