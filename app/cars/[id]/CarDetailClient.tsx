'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCarById, getCars, formatPrice, getCarColourOption, type Car } from '@/lib/cars'
import { BidForm } from './BidForm'

export function CarDetailClient({ id }: { id: string }) {
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    let active = true

    async function loadCar() {
      try {
        const direct = await getCarById(id)
        if (active && direct) {
          setCar(direct)
          setSelectedImageIndex(0)
          return
        }

        const cars = await getCars({ pageLimit: 500 })
        if (active) {
          setCar(cars.find(item => item.id === id) ?? null)
          setSelectedImageIndex(0)
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
  const selectedImage = images[selectedImageIndex] ?? images[0]
  const contactName = car.isTrusted ? 'Vehiqal admin' : car.sellerName || 'Seller'
  const contactPhone = car.isTrusted ? '+923114642679' : car.sellerPhone || ''
  const displayPhone = car.isTrusted ? '0311 4642679' : contactPhone
  const whatsappPhone = contactPhone.replace(/\D/g, '')
  const colourOption = getCarColourOption(car.colour)
  const inspectionSections = car.inspectionReport?.sections ?? []
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
              {selectedImage
                ? <div className="relative h-72 md:h-96"><Image src={selectedImage} alt={`${car.make} ${car.model} ${car.year}`} fill className="object-cover" priority/></div>
                : <div className="h-72 flex items-center justify-center text-7xl">🚗</div>
              }
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-6">
                {images.map((img,i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative h-20 rounded-xl overflow-hidden bg-navylight border transition-all ${selectedImageIndex===i?'border-navy ring-2 ring-navy/20':'border-transparent hover:border-navy/40'}`}
                  >
                    <Image src={img} alt="" fill className="object-cover"/>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">{car.make} {car.model} {car.year}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {car.isTrusted && <span className="trusted-badge inline-flex">✓ Inspected</span>}
                  {car.status === 'sold' && <span className="inline-flex rounded-full bg-navy px-3 py-1 text-xs font-black text-white">Sold</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl md:text-3xl font-black text-navy">{formatPrice(car.price)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[`📍 ${car.city}`,`🔢 ${Number(car.mileage).toLocaleString()} km`,`⚙️ ${car.transmission}`,car.engineSize?`🔧 ${car.engineSize}`:null].filter(Boolean).map((chip,i) => (
                <span key={i} className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">{chip}</span>
              ))}
              {colourOption&&(
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                  <span className="h-4 w-4 rounded-full border border-gray-300" style={{backgroundColor: colourOption.hex}}/>
                  {colourOption.name}
                </span>
              )}
            </div>
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">{car.isTrusted ? 'Inspected car contact' : 'Seller contact'}</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{contactName}</h2>
                  <p className="text-sm text-gray-500">
                    {car.isTrusted ? 'Vehiqal manages this inspected car deal.' : 'Contact the seller directly for this uninspected listing.'}
                  </p>
                </div>
                {contactPhone ? (
                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${contactPhone}`} className="btn-navy text-sm !px-4 !py-2">Call {displayPhone}</a>
                    {whatsappPhone && (
                      <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-green px-4 py-2 text-sm font-bold text-white hover:bg-[#158759]">WhatsApp</a>
                    )}
                  </div>
                ) : (
                  <span className="rounded-xl bg-gray-50 px-4 py-2 text-sm font-bold text-gray-400">Phone not saved</span>
                )}
              </div>
            </div>
            {car.isTrusted && (
              <div className="bg-greenlight border border-green/30 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green text-white font-black">✓</span>
                    <div><div className="font-black text-gray-800">Inspected by Vehiqal</div><div className="text-sm text-green">Admin verified listing · Contact Vehiqal for this car</div></div>
                  </div>
                  {car.overallScore && <div className="text-right"><div className="text-3xl font-black text-navy">{car.overallScore}</div><div className="text-xs text-gray-400">/ 10</div></div>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="tel:+923114642679" className="btn-navy text-sm !px-4 !py-2">Call Vehiqal</a>
                  <a href="https://wa.me/923114642679" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-green px-4 py-2 text-sm font-bold text-white hover:bg-[#158759]">WhatsApp admin</a>
                </div>
              </div>
            )}
            {car.isTrusted && inspectionSections.length > 0 && (
              <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-green">Inspection report</p>
                    <h2 className="text-lg font-black text-gray-900">10-section vehicle health</h2>
                  </div>
                  {car.inspectionReport?.overallScore && (
                    <div className="rounded-xl bg-greenlight px-4 py-2 text-center">
                      <p className="text-2xl font-black text-navy">{car.inspectionReport.overallScore}</p>
                      <p className="text-xs text-gray-400">/ 10</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  {inspectionSections.map(section => {
                    const score = Number(section.score) || 0
                    return (
                      <div key={section.id} className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{section.title}</p>
                            <p className="text-xs text-gray-400">{section.points} checklist points</p>
                          </div>
                          <p className="text-sm font-black text-navy">{score}/10</p>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-green" style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }} />
                        </div>
                        {section.notes && <p className="mt-2 text-xs text-gray-500">{section.notes}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {car.description && <div className="mb-6"><h2 className="font-black text-gray-900 text-lg mb-3">Description</h2><p className="text-gray-600 leading-relaxed">{car.description}</p></div>}
            <div className="bg-navylight rounded-2xl p-5 text-sm text-navy">
              🛡️ All inspected car deals managed by Vehiqal. We take full responsibility for payment and car. Call <a href="tel:+923114642679" className="font-black hover:underline">0311 4642679</a>
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
