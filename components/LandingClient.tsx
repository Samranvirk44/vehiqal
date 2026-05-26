'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CarCard } from '@/components/CarCard'
import { CITIES, MAKES, type Car } from '@/lib/cars'

export function HeroSearch() {
  const router = useRouter()
  const [make, setMake] = useState('')
  const [city, setCity] = useState('')
  const [trusted, setTrusted] = useState(false)
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    import('@/lib/cars').then(({ getCars }) => {
      getCars({
        makeFilter: make || undefined,
        city: city || undefined,
        trustedOnly: trusted || undefined,
        pageLimit: 8,
      })
        .then(results => {
          if (!cancelled) setCars(results)
        })
        .catch(() => {
          if (!cancelled) setCars([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })

    return () => { cancelled = true }
  }, [make, city, trusted])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (make) p.set('make', make)
    if (city) p.set('city', city)
    if (trusted) p.set('trusted', 'true')
    router.push(`/cars${p.toString() ? `?${p.toString()}` : ''}`)
  }

  const handleClear = () => {
    setMake('')
    setCity('')
    setTrusted(false)
  }

  const p = new URLSearchParams()
  if (make) p.set('make', make)
  if (city) p.set('city', city)
  if (trusted) p.set('trusted', 'true')
  const browseHref = `/cars${p.toString() ? `?${p.toString()}` : ''}`
  const resultTitle = trusted
    ? `${city ? `Inspected cars in ${city}` : 'Inspected cars'}`
    : `${city ? `Cars in ${city}` : 'Latest cars'}`
  const resultLabel = loading
    ? 'Finding cars...'
    : `${cars.length} ${trusted ? 'inspected ' : ''}car${cars.length !== 1 ? 's' : ''}${city ? ` in ${city}` : ' available'}`

  return (
    <div className="space-y-3 md:space-y-4">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/95 p-3 text-left shadow-2xl shadow-black/20 ring-1 ring-white/70 backdrop-blur md:rounded-3xl md:p-4">
        <div className="mb-3 flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gold">Search inventory</p>
            <p className="mt-1 text-xs font-semibold text-gray-500 md:text-sm">Filter by make, city, and inspection status.</p>
          </div>
          <p className="text-xs font-bold text-gray-400">{resultLabel}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_auto_auto]">
          <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 transition-all focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/10 md:rounded-2xl md:py-2.5">
            <span className="block text-[11px] font-black uppercase tracking-wide text-gray-400">Make</span>
            <select
              aria-label="Filter by make"
              value={make}
              onChange={e => setMake(e.target.value)}
              className="mt-0.5 h-7 w-full cursor-pointer bg-transparent text-sm font-black text-gray-900 outline-none md:mt-1 md:h-8 md:text-base"
            >
              <option value="">Any make</option>
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 transition-all focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/10 md:rounded-2xl md:py-2.5">
            <span className="block text-[11px] font-black uppercase tracking-wide text-gray-400">City</span>
            <select
              aria-label="Filter by city"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="mt-0.5 h-7 w-full cursor-pointer bg-transparent text-sm font-black text-gray-900 outline-none md:mt-1 md:h-8 md:text-base"
            >
              <option value="">Any city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className={`flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 transition-all md:col-span-2 md:min-h-[58px] md:gap-3 md:rounded-2xl xl:col-span-1 ${trusted ? 'border-green bg-greenlight text-green' : 'border-gray-200 bg-white text-gray-700 hover:border-navy/30 hover:bg-gray-50'}`}>
            <input
              type="checkbox"
              checked={trusted}
              onChange={e => setTrusted(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-green"
            />
            <span className="whitespace-nowrap text-sm font-black">Inspected only</span>
          </label>

          <div className="grid grid-cols-[1fr_auto] gap-2 md:col-span-2 xl:col-span-1">
            <button type="submit" className="flex min-h-[46px] items-center justify-center rounded-xl bg-navy px-5 text-sm font-black text-white transition-colors hover:bg-navydark md:min-h-[58px] md:rounded-2xl md:px-7">
              Search cars
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex min-h-[46px] items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 md:min-h-[58px] md:rounded-2xl md:px-5"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left shadow-xl shadow-black/10 backdrop-blur md:rounded-[24px] md:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
          <div>
            <p className="text-sm font-black text-white">{resultTitle}</p>
            <p className="text-xs font-semibold text-blue-300/65">{resultLabel}</p>
          </div>
          <Link href={browseHref} className="text-sm font-black text-gold hover:text-yellow-300">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden md:gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-[320px] min-w-[250px] rounded-xl bg-white/10 animate-pulse sm:min-w-[315px] md:h-[360px] md:rounded-2xl" />
            ))}
          </div>
        ) : cars.length > 0 ? (
          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex gap-3 px-1 md:gap-4">
              {cars.map(car => (
                <div key={car.id} className="min-w-[250px] max-w-[290px] flex-none text-left sm:min-w-[315px] md:max-w-[315px]">
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
            <p className="font-black text-white">No cars found</p>
            <p className="mt-1 text-sm text-blue-300/65">Try another city or make.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Latest cars section — fetches client-side so Firebase Web SDK works
export function LatestCars() {
  const [cars, setCars] = useState<Car[]>([])
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
      {cars.map(car => (
        <CarCard key={car.id} car={car}/>
      ))}
    </div>
  )
}
