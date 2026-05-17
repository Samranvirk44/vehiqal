'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CITIES, MAKES } from '@/lib/cars'

export function HeroSearch() {
  const router = useRouter()
  const [make, setMake] = useState('')
  const [city, setCity] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (make) p.set('make', make)
    if (city) p.set('city', city)
    router.push(`/cars?${p.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <select value={make} onChange={e => setMake(e.target.value)}
        className="flex-1 bg-white/10 border border-white/20 text-white font-semibold rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-gold backdrop-blur">
        <option value="" className="text-gray-800 bg-white">Any make</option>
        {MAKES.map(m => <option key={m} value={m} className="text-gray-800 bg-white">{m}</option>)}
      </select>
      <select value={city} onChange={e => setCity(e.target.value)}
        className="flex-1 bg-white/10 border border-white/20 text-white font-semibold rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-gold backdrop-blur">
        <option value="" className="text-gray-800 bg-white">Any city</option>
        {CITIES.map(c => <option key={c} value={c} className="text-gray-800 bg-white">{c}</option>)}
      </select>
      <button type="submit" className="btn-gold px-8 py-4 text-base whitespace-nowrap !rounded-xl">
        Search cars →
      </button>
    </form>
  )
}

// Latest cars section — fetches client-side so Firebase Web SDK works
export function LatestCars() {
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('@/lib/cars').then(({ getCars }) => {
      getCars({ pageLimit: 6 }).then(r => { setCars(r); setLoading(false) }).catch(() => setLoading(false))
    })
  }, [])

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_,i) => (
        <div key={i} className="bg-white/5 rounded-2xl h-64 animate-pulse"/>
      ))}
    </div>
  )

  if (cars.length === 0) return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div className="text-5xl mb-4">🚗</div>
      <p className="font-black text-gray-800 text-xl mb-2">First listings coming soon</p>
      <p className="text-gray-400 mt-2 mb-6">Be the first to list your car on Vehiqal</p>
      <a href="/sell" className="btn-navy">List your car — it&apos;s free</a>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car: any) => (
        <a key={car.id} href={`/cars/${car.id}`}
          className="card group block bg-white">
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            {car.images?.[0]
              ? <img src={car.images[0]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              : <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
            }
            {car.isTrusted && (
              <span className="absolute top-3 right-3 trusted-badge">★ Verified</span>
            )}
          </div>
          <div className="p-5">
            <h3 className="font-bold text-gray-900 text-lg">{car.make} {car.model} {car.year}</h3>
            <p className="text-navy font-black text-xl mt-1">PKR {((car.price||0)/100000).toFixed(0)} lac</p>
            <p className="text-gray-400 text-sm mt-1">📍 {car.city} · {Number(car.mileage||0).toLocaleString()} km</p>
          </div>
        </a>
      ))}
    </div>
  )
}
