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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8 rounded-3xl bg-navylight p-6 md:p-8">
        <div className="trusted-badge mb-4">✓ Inspected cars appear first</div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 max-w-2xl">
          {loading ? 'Loading listings…' : `${cars.length} listing${cars.length !== 1 ? 's' : ''} found`}
          {' '}Verified cars are marked as Inspected and handled through Vehiqal contact.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 flex flex-wrap gap-3 shadow-sm">
        <select
          value={make} onChange={e => setMake(e.target.value)}
          className="flex-1 min-w-[140px] input !py-2.5 text-sm">
          {MAKES_WITH_ALL.map(m => <option key={m} value={m}>{m === 'All' ? 'Any make' : m}</option>)}
        </select>
        <select
          value={city} onChange={e => setCity(e.target.value)}
          className="flex-1 min-w-[140px] input !py-2.5 text-sm">
          {CITIES_WITH_ALL.map(c => <option key={c} value={c}>{c === 'All' ? 'Any city' : c}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
          <input
            type="checkbox" checked={trusted}
            onChange={e => setTrusted(e.target.checked)}
            className="accent-gold"/>
          <span className="text-sm font-semibold text-gray-700">✓ Inspected only</span>
        </label>
        <button onClick={handleApply} className="btn-navy text-sm !px-6 !py-2.5">Apply</button>
        <button onClick={() => { setCity('All'); setMake('All'); setTrusted(false); router.push('/cars') }}
          className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium">
          Clear
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100"/>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"/>
                <div className="h-5 bg-gray-100 rounded w-1/2"/>
                <div className="h-3 bg-gray-100 rounded w-2/3"/>
              </div>
            </div>
          ))}
        </div>
      ) : cars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map(car => <CarCard key={car.id} car={car} />)}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-black text-gray-700 mb-2">No cars found</h2>
          <p className="text-gray-400 mb-6">Try different filters or check back soon</p>
          <Link href="/cars" className="btn-navy">Clear filters</Link>
        </div>
      )}
    </div>
  )
}
