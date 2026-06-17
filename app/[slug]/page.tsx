import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { CityCarsPage } from '@/components/CityCarsPage'
import { SellForm } from '@/app/sell/SellForm'
import { SERVICE_AREAS, cityCarsMeta, citySlug, pageMeta, sellCityMeta } from '@/lib/seo'

const cityBySlug = Object.fromEntries(
  SERVICE_AREAS.map(city => [citySlug(city), city])
)
const explicitCitySlugs = new Set(['gujranwala','gujrat','islamabad','karachi','lahore','sheikhupura','sialkot'])

function cityFromSlug(slug: string, prefix: string) {
  if (!slug.startsWith(prefix)) return null
  return cityBySlug[slug.slice(prefix.length)] ?? null
}

export function generateStaticParams() {
  return SERVICE_AREAS.filter(city => !explicitCitySlugs.has(citySlug(city))).flatMap(city => [
    { slug:`cars-for-sale-${citySlug(city)}` },
    { slug:`sell-car-${citySlug(city)}` },
  ])
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const carsCity = cityFromSlug(params.slug, 'cars-for-sale-')
  if (carsCity) {
    return cityCarsMeta(carsCity)
  }

  const sellCity = cityFromSlug(params.slug, 'sell-car-')
  if (sellCity) {
    return sellCityMeta(sellCity)
  }

  return pageMeta({
    title:'Page Not Found - Vehiqal',
    description:'This Vehiqal page could not be found.',
    path:`/${params.slug}`,
    noIndex:true,
  })
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
        <Suspense fallback={<div className="card p-8 text-center text-gray-500">Loading form...</div>}>
          <SellForm />
        </Suspense>
      </div>
    )
  }

  notFound()
}
