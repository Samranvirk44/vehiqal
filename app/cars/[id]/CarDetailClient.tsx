'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCarById, getCars, formatPrice, type Car } from '@/lib/cars'
import { BidForm } from './BidForm'

export function CarDetailClient({ id }: { id: string }) {
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadCar() {
      try {
        const direct = await getCarById(id)
        if (active && direct) {
          setCar(direct)
          return
        }

        const cars = await getCars({ pageLimit: 500 })
        if (active) {
          setCar(cars.find(item => item.id === id) ?? null)
        }
      } catch (error) {
        console.error('Error loading car:', error)
        if (active) setCar(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCar()

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-72 md:h-96 bg-navylight rounded-2xl animate-pulse" />
            <div className="h-8 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!car || car.status === 'removed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Car not found</h1>
        <p className="text-gray-500 mb-6">This listing may have been removed.</p>
        <Link href="/cars" className="btn-navy">Browse cars</Link>
      </div>
    )
  }

  const images = car.images?.length ? car.images : []
  const jsonLd = {
    '@context':'https://schema.org','@type':'Product',
    name:`${car.make} ${car.model} ${car.year}`,
    description:car.description||`${car.year} ${car.make} ${car.model} in ${car.city}`,
    image:images[0]??'',
    offers:{'@type':'Offer',priceCurrency:'PKR',price:car.price,availability:'https://schema.org/InStock'},
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(jsonLd) }}/>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-navy">Home</Link><span>/</span>
          <Link href="/cars" className="hover:text-navy">Cars</Link><span>/</span>
          <span className="text-gray-700 font-medium">{car.make} {car.model} {car.year}</span>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden mb-4 bg-navylight">
              {images[0]
                ? <div className="relative h-72 md:h-96"><Image src={images[0]} alt={`${car.make} ${car.model} ${car.year}`} fill className="object-cover" priority/></div>
                : <div className="h-72 flex items-center justify-center text-7xl">🚗</div>
              }
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {images.slice(1,5).map((img,i) => (
                  <div key={i} className="relative h-20 rounded-xl overflow-hidden bg-navylight">
                    <Image src={img} alt="" fill className="object-cover"/>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">{car.make} {car.model} {car.year}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {car.isTrusted && <span className="trusted-badge inline-flex">★ Trusted Verified</span>}
                  {car.status === 'sold' && <span className="inline-flex rounded-full bg-navy px-3 py-1 text-xs font-black text-white">Sold</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl md:text-3xl font-black text-navy">{formatPrice(car.price)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[`📍 ${car.city}`,`🔢 ${Number(car.mileage).toLocaleString()} km`,`⚙️ ${car.transmission}`,car.engineSize?`🔧 ${car.engineSize}`:null,car.colour?`🎨 ${car.colour}`:null].filter(Boolean).map((chip,i) => (
                <span key={i} className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">{chip}</span>
              ))}
            </div>
            {car.isTrusted && (
              <div className="bg-goldlight border border-gold/40 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">★</span>
                    <div><div className="font-black text-gray-800">Trusted Verified</div><div className="text-sm text-yellow-700">300-point physical inspection</div></div>
                  </div>
                  {car.overallScore && <div className="text-right"><div className="text-3xl font-black text-navy">{car.overallScore}</div><div className="text-xs text-gray-400">/ 10</div></div>}
                </div>
              </div>
            )}
            {car.description && <div className="mb-6"><h2 className="font-black text-gray-900 text-lg mb-3">Description</h2><p className="text-gray-600 leading-relaxed">{car.description}</p></div>}
            <div className="bg-navylight rounded-2xl p-5 text-sm text-navy">
              🛡️ All deals managed by Vehiqal. We take full responsibility for payment and car. Call <a href="tel:+923114642679" className="font-black hover:underline">0311 4642679</a>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <BidForm car={car}/>
              <div className="card p-5">
                <p className="font-bold text-gray-700 text-sm mb-3">Share this car</p>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${car.make} ${car.model} ${car.year} — ${formatPrice(car.price)} — vehiqal.com/cars/${car.id}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl py-3 text-center mb-2">
                  Share on WhatsApp
                </a>
                <div className="bg-navylight rounded-xl p-3 text-center">
                  <p className="text-navy text-xs font-bold mb-1">Need help?</p>
                  <a href="tel:+923114642679" className="text-navy font-black text-lg">0311 4642679</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
