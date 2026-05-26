'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCars, CITIES_WITH_ALL, MAKES_WITH_ALL, type Car } from '@/lib/cars'
import { CarCard } from '@/components/CarCard'

interface Props {
  initialCity: string
  initialMake: string
  initialTrusted: boolean
}

export function CarsClient({ initialCity, initialMake, initialTrusted }: Props) {
  const router  = useRouter()
  const [cars, setCars]     = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity]     = useState(initialCity)
  const [make, setMake]     = useState(initialMake)
  const [trusted, setTrusted] = useState(initialTrusted)

  useEffect(() => {
    setLoading(true)
    getCars({
      city:        city    !== 'All' ? city    : undefined,
      makeFilter:  make    !== 'All' ? make    : undefined,
      trustedOnly: trusted || undefined,
      pageLimit:   40,
    }).then(results => {
      setCars(results)
      setLoading(false)
    }).catch(e => {
      console.error('Failed to load cars:', e)
      setLoading(false)
    })
  }, [city, make, trusted])

  const handleApply = () => {
    const p = new URLSearchParams()
    if (city    !== 'All') p.set('city', city)
    if (make    !== 'All') p.set('make', make)
    if (trusted)           p.set('trusted', 'true')
    router.push(`/cars?${p.toString()}`)
  }

  const title = `${trusted ? 'Inspected ' : ''}${make !== 'All' ? make + ' ' : ''}Cars${city !== 'All' ? ` in ${city}` : ' for Sale in Pakistan'}`

  const listingSummary = loading ? 'Loading listings...' : `${cars.length} listing${cars.length !== 1 ? 's' : ''} found.`

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:py-8">
      <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:mb-6 md:rounded-2xl md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="trusted-badge mb-3">✓ Inspected cars appear first</div>
            <h1 className="text-2xl font-black leading-tight text-gray-900 md:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {listingSummary} Inspected cars are handled through Vehiqal contact.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto_auto_auto] xl:max-w-3xl">
            <label className="rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/10">
              <span className="block text-[10px] font-black uppercase tracking-wide text-gray-400">Make</span>
              <select
                aria-label="Filter by make"
                value={make} onChange={e => setMake(e.target.value)}
                className="mt-0.5 h-7 w-full bg-transparent text-sm font-black text-gray-900 outline-none">
                {MAKES_WITH_ALL.map(m => <option key={m} value={m}>{m === 'All' ? 'Any make' : m}</option>)}
              </select>
            </label>
            <label className="rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/10">
              <span className="block text-[10px] font-black uppercase tracking-wide text-gray-400">City</span>
              <select
                aria-label="Filter by city"
                value={city} onChange={e => setCity(e.target.value)}
                className="mt-0.5 h-7 w-full bg-transparent text-sm font-black text-gray-900 outline-none">
                {CITIES_WITH_ALL.map(c => <option key={c} value={c}>{c === 'All' ? 'Any city' : c}</option>)}
              </select>
            </label>
            <label className={`flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 sm:col-span-2 lg:col-span-1 ${trusted ? 'border-green bg-greenlight text-green' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <input
                type="checkbox" checked={trusted}
                onChange={e => setTrusted(e.target.checked)}
                className="accent-green"/>
              <span className="whitespace-nowrap text-sm font-black">Inspected only</span>
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:col-span-2 lg:col-span-2">
              <button onClick={handleApply} className="btn-navy !px-6 !py-2.5 text-sm">Search cars</button>
              <button onClick={() => { setCity('All'); setMake('All'); setTrusted(false); router.push('/cars') }}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-black text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                Clear
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-gray-100 bg-white animate-pulse">
              <div className="aspect-[4/3] bg-gray-100"/>
              <div className="space-y-3 p-4 md:p-5">
                <div className="h-4 bg-gray-100 rounded w-3/4"/>
                <div className="h-5 bg-gray-100 rounded w-1/2"/>
                <div className="h-3 bg-gray-100 rounded w-2/3"/>
              </div>
            </div>
          ))}
        </div>
      ) : cars.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
          {cars.map(car => <CarCard key={car.id} car={car} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white py-16 text-center md:py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-black text-gray-700 mb-2">No cars found</h2>
          <p className="text-gray-400 mb-6">Try different filters or check back soon</p>
          <Link href="/cars" className="btn-navy">Clear filters</Link>
        </div>
      )}
    </div>
  )
}
