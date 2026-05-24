'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Car, formatPrice, getCarColourOption } from '@/lib/cars'

export function CarCard({ car }: { car: Car }) {
  const images = car.images?.filter(Boolean) ?? []
  const [photoIndex, setPhotoIndex] = useState(0)
  const swipeStartX = useRef<number | null>(null)
  const image = images[photoIndex] ?? null
  const colourOption = getCarColourOption(car.colour)

  const movePhoto = (direction: -1 | 1) => {
    if (images.length < 2) return
    setPhotoIndex(current => (current + direction + images.length) % images.length)
  }

  const handleSwipeEnd = (x: number) => {
    if (swipeStartX.current === null) return
    const distance = x - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(distance) < 35) return
    movePhoto(distance > 0 ? -1 : 1)
  }

  return (
    <article className={`card group overflow-hidden ${car.isTrusted ? 'border-green/30 ring-1 ring-green/20 shadow-md' : ''}`}>
      <div
        className="relative h-48 touch-pan-y select-none overflow-hidden bg-navylight"
        onPointerDown={event => {
          if ((event.target as HTMLElement).closest('button')) return
          swipeStartX.current = event.clientX
        }}
        onPointerUp={event => handleSwipeEnd(event.clientX)}
        onPointerCancel={() => { swipeStartX.current = null }}
      >
        {image
          ? (
            <Image
              src={image}
              alt={`${car.make} ${car.model} ${car.year}`}
              fill
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 33vw, 315px"
              quality={55}
              className="pointer-events-none object-cover"
              draggable={false}
            />
          )
          : <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
        }
        {car.isTrusted && (
          <div className="absolute right-3 top-3 z-20">
            <span className="trusted-badge">✓ Inspected</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={event => {
                event.preventDefault()
                event.stopPropagation()
                movePhoto(-1)
              }}
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-black text-navy shadow-sm transition-colors hover:bg-white"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={event => {
                event.preventDefault()
                event.stopPropagation()
                movePhoto(1)
              }}
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-black text-navy shadow-sm transition-colors hover:bg-white"
            >
              &rsaquo;
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${index === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
            <div className="absolute bottom-3 right-3 z-20 rounded-full bg-black/45 px-2 py-1 text-xs font-bold text-white">
              {photoIndex + 1}/{images.length}
            </div>
          </>
        )}
      </div>
      <div className="p-5">
        {car.isTrusted && <p className="mb-2 text-xs font-black uppercase tracking-wide text-green">Vehiqal verified car</p>}
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{car.make} {car.model} {car.year}</h3>
        <p className="text-navy font-black text-xl mt-1">{formatPrice(car.price)}</p>
        <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm flex-wrap">
          <span>📍 {car.city}</span>
          <span>·</span>
          <span>{Number(car.mileage).toLocaleString()} km</span>
          {car.transmission && <><span>·</span><span>{car.transmission}</span></>}
          {car.fuelType && <><span>·</span><span>{car.fuelType}</span></>}
          {car.condition && <><span>·</span><span>{car.condition}</span></>}
          {colourOption && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full border border-gray-300" style={{backgroundColor: colourOption.hex}}/>
                {colourOption.name}
              </span>
            </>
          )}
        </div>
        {car.isTrusted && car.overallScore && (
          <div className="mt-2 text-green-600 text-xs font-bold">Score: {car.overallScore}/10</div>
        )}
        <Link href={`/cars/${car.id}`} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-navy/90">
          View details
        </Link>
      </div>
    </article>
  )
}
