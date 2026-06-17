import type { Metadata } from 'next'
import Link from 'next/link'
import { CarDetailClient } from './CarDetailClient'
import { formatPrice, type Car } from '@/lib/cars'
import { CONTACT_PHONE_DISPLAY, absoluteUrl, breadcrumbJsonLd, citySlug, jsonLdGraph, organizationJsonLd, pageMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FirestoreValue = {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  arrayValue?: { values?: FirestoreValue[] }
}

function fieldString(fields: Record<string, FirestoreValue> | undefined, key: string) {
  return fields?.[key]?.stringValue ?? ''
}

function fieldNumber(fields: Record<string, FirestoreValue> | undefined, key: string) {
  const value = fields?.[key]
  return Number(value?.integerValue ?? value?.doubleValue ?? 0)
}

function carFromFirestore(id: string, fields: Record<string, FirestoreValue> | undefined): Car {
  return {
    id,
    make:fieldString(fields, 'make'),
    model:fieldString(fields, 'model'),
    year:fieldString(fields, 'year'),
    price:fieldNumber(fields, 'price'),
    mileage:fieldNumber(fields, 'mileage'),
    city:fieldString(fields, 'city'),
    transmission:fieldString(fields, 'transmission'),
    registeredLocation:fieldString(fields, 'registeredLocation') || undefined,
    fuelType:fieldString(fields, 'fuelType') || undefined,
    assembly:fieldString(fields, 'assembly') || undefined,
    colour:fieldString(fields, 'colour') || undefined,
    condition:fieldString(fields, 'condition') || undefined,
    sellerName:fieldString(fields, 'sellerName') || undefined,
    sellerPhone:fieldString(fields, 'sellerPhone') || undefined,
    overallScore:fieldNumber(fields, 'overallScore') || undefined,
    images:fields?.images?.arrayValue?.values?.map(value => value.stringValue ?? '').filter(Boolean) ?? [],
    isTrusted:Boolean(fields?.isTrusted?.booleanValue),
    status:fieldString(fields, 'status') || undefined,
  } as Car
}

function seoPrice(value: number) {
  return formatPrice(seoPriceNumber(value))
}

function seoPriceNumber(value: number) {
  let normalized = value
  if (normalized > 10_000_000_000) normalized = normalized / 100_000
  else if (normalized > 100_000_000) normalized = normalized / 100
  return normalized
}

async function getCarForMetadata(id: string): Promise<Car | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!projectId || !apiKey) return null

  try {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/cars/${id}`
    )
    url.searchParams.set('key', apiKey)

    const response = await fetch(url, { cache:'no-store' })
    if (!response.ok) return null

    const document = await response.json() as {
      fields?: Record<string, FirestoreValue>
    }
    const fields = document.fields

    return carFromFirestore(id, fields)
  } catch {
    return null
  }
}

async function getRelatedCars(car: Car): Promise<Car[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!projectId || !apiKey) return []

  try {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/cars`
    )
    url.searchParams.set('pageSize', '100')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url, { cache:'no-store' })
    if (!response.ok) return []

    const data = await response.json() as {
      documents?: Array<{
        name: string
        fields?: Record<string, FirestoreValue>
      }>
    }

    return (data.documents ?? [])
      .map(document => carFromFirestore(document.name.split('/').pop() ?? '', document.fields))
      .filter(item => item.id && item.id !== car.id && item.status !== 'removed')
      .sort((a, b) => {
        const aScore = Number(a.make === car.make) * 4 + Number(a.city === car.city) * 3 + Number(a.isTrusted)
        const bScore = Number(b.make === car.make) * 4 + Number(b.city === car.city) * 3 + Number(b.isTrusted)
        return bScore - aScore
      })
      .slice(0, 6)
  } catch {
    return []
  }
}

function RelatedCarsSection({ car, relatedCars }: { car: Car; relatedCars: Car[] }) {
  if (relatedCars.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">Related cars</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">More cars like this {car.make} {car.model}</h2>
            <p className="mt-2 text-sm text-gray-500">
              Compare similar used cars by make, city, year, price, and inspection status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-black">
            <Link href={`/cars?make=${encodeURIComponent(car.make)}`} className="rounded-lg bg-navylight px-3 py-2 text-navy hover:bg-blue-50">
              More {car.make} cars
            </Link>
            <Link href={`/cars-for-sale-${citySlug(car.city)}`} className="rounded-lg bg-navylight px-3 py-2 text-navy hover:bg-blue-50">
              Cars in {car.city}
            </Link>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {relatedCars.map(related => (
            <Link
              key={related.id}
              href={`/cars/${related.id}`}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-navy/20 hover:bg-white hover:shadow-sm"
            >
              <h3 className="font-black text-gray-900">{related.year} {related.make} {related.model}</h3>
              <p className="mt-1 text-sm font-black text-navy">{seoPrice(related.price)}</p>
              <p className="mt-2 text-xs font-semibold text-gray-500">
                {related.city}{related.colour ? ` · ${related.colour}` : ''}{Number(related.mileage) > 0 ? ` · ${Number(related.mileage).toLocaleString()} km` : ''}
              </p>
              {related.isTrusted && <p className="mt-2 text-xs font-black text-green">Inspected by Vehiqal</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function carJsonLd(car: Car) {
  const carUrl = absoluteUrl(`/cars/${car.id}`)
  const carName = `${car.year} ${car.make} ${car.model}`
  const price = seoPriceNumber(car.price)

  return jsonLdGraph([
    organizationJsonLd(),
    {
      '@type':['Product','Vehicle'],
      '@id':`${carUrl}#vehicle`,
      name:carName,
      mainEntityOfPage:carUrl,
      brand:{ '@type':'Brand', name:car.make },
      manufacturer:{ '@type':'Brand', name:car.make },
      model:car.model,
      vehicleModelDate:car.year,
      mileageFromOdometer:Number(car.mileage) > 0 ? {
        '@type':'QuantitativeValue',
        value:car.mileage,
        unitCode:'KMT',
      } : undefined,
      fuelType:car.fuelType || undefined,
      vehicleTransmission:car.transmission || undefined,
      vehicleConfiguration:car.assembly || undefined,
      color:car.colour || undefined,
      sku:car.id,
      description:`${carName} for sale in ${car.city} on Vehiqal.`,
      image:car.images?.length ? car.images : [absoluteUrl('/opengraph-image')],
      url:carUrl,
      itemCondition:car.condition?.toLowerCase().includes('new') ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      offers:{
        '@type':'Offer',
        '@id':`${carUrl}#offer`,
        url:carUrl,
        priceCurrency:'PKR',
        price,
        availability:car.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        seller:{
          '@type':'Organization',
          '@id':car.isTrusted ? absoluteUrl('/#organization') : undefined,
          name:car.isTrusted ? 'Vehiqal' : (car.sellerName || 'Vehiqal seller'),
          telephone:car.sellerPhone || undefined,
        },
      },
      additionalProperty:[
        car.isTrusted ? { '@type':'PropertyValue', name:'Inspection status', value:'Inspected by Vehiqal' } : null,
        typeof car.overallScore === 'number' ? { '@type':'PropertyValue', name:'Inspection score', value:`${car.overallScore}/10` } : null,
        car.condition ? { '@type':'PropertyValue', name:'Condition', value:car.condition } : null,
        car.registeredLocation ? { '@type':'PropertyValue', name:'Registered', value:car.registeredLocation } : null,
      ].filter(Boolean),
    },
    breadcrumbJsonLd([
      { name:'Home', path:'/' },
      { name:'Cars', path:'/cars' },
      { name:carName, path:`/cars/${car.id}` },
    ]),
  ])
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const car = await getCarForMetadata(params.id)

  if (!car || car.status === 'removed') {
    return pageMeta({
      title:'Car Not Found - Vehiqal',
      description:'This car listing may have been removed. Browse available inspected used cars on Vehiqal.',
      path:`/cars/${params.id}`,
      noIndex:true,
    })
  }

  const carName = `${car.year} ${car.make} ${car.model}`
  const price = seoPrice(car.price)
  const title = `${carName} for Sale in ${car.city} - ${price}`
  const description = `Buy ${carName} in ${car.city} for ${price} on Vehiqal. View photos, mileage, features, seller details, and inspection status for this used car.`
  const path = `/cars/${params.id}`
  const image = car.images?.[0] || '/opengraph-image'
  const imageUrl = absoluteUrl(image)
  const mileage = Number(car.mileage) > 0 ? ` Mileage: ${Number(car.mileage).toLocaleString()} km.` : ''
  const inspected = car.isTrusted ? ' Inspected by Vehiqal.' : ''
  const registered = car.registeredLocation ? ` Registered in ${car.registeredLocation}.` : ''
  const registeredKeywords = car.registeredLocation ? [`${car.registeredLocation} registered car`] : []

  const metadata = pageMeta({
    title,
    description:`${description}${mileage}${registered}${inspected} Call ${CONTACT_PHONE_DISPLAY}.`,
    path,
    image,
    keywords:[car.make, car.model, car.year, price, `${car.make} ${car.model}`, `${car.year} ${car.make} ${car.model}`, `used cars ${car.city}`, `cars for sale ${car.city}`, ...registeredKeywords],
    noIndex:car.status === 'sold',
  })

  return {
    ...metadata,
    openGraph:{
      ...metadata.openGraph,
      title,
      description,
      url:absoluteUrl(path),
      type:'website',
      images:[{ url:imageUrl, width:1200, height:630, alt:`${carName} for sale in ${car.city} on Vehiqal` }],
    },
    twitter:{
      ...metadata.twitter,
      card:'summary_large_image',
      title,
      description,
      images:[imageUrl],
    },
  }
}

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const car = await getCarForMetadata(params.id)
  const relatedCars = car && car.status !== 'removed' ? await getRelatedCars(car) : []

  return (
    <>
      {car && car.status !== 'removed' && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(carJsonLd(car)) }}/>
      )}
      <CarDetailClient id={params.id} />
      {car && car.status !== 'removed' && <RelatedCarsSection car={car} relatedCars={relatedCars} />}
    </>
  )
}
