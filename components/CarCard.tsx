import Link from 'next/link'
import Image from 'next/image'
import { Car, formatPrice } from '@/lib/cars'

export function CarCard({ car }: { car: Car }) {
  const image = car.images?.[0] ?? null
  return (
    <Link href={`/cars/${car.id}`} className="card group block">
      <div className="relative h-48 bg-navylight overflow-hidden">
        {image
          ? <Image src={image} alt={`${car.make} ${car.model} ${car.year}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
        }
        {car.isTrusted && (
          <div className="absolute top-3 right-3">
            <span className="trusted-badge">★ Verified</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{car.make} {car.model} {car.year}</h3>
        <p className="text-navy font-black text-xl mt-1">{formatPrice(car.price)}</p>
        <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm flex-wrap">
          <span>📍 {car.city}</span>
          <span>·</span>
          <span>{Number(car.mileage).toLocaleString()} km</span>
          {car.transmission && <><span>·</span><span>{car.transmission}</span></>}
        </div>
        {car.isTrusted && car.overallScore && (
          <div className="mt-2 text-green-600 text-xs font-bold">Score: {car.overallScore}/10</div>
        )}
      </div>
    </Link>
  )
}
