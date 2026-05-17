'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { clearAdminSession, hasAdminSession, isAdminIdentity, setAdminSession } from '@/lib/admin'
import { getUserProfiles, onAuthChange } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { getAllBidsForAdmin, getAllCars, formatPrice, type Bid, type BidStatus, type Car, type CarStatus } from '@/lib/cars'
import type { User } from 'firebase/auth'

const ST: Record<string,string> = {
  pending:  'bg-yellow-50 text-yellow-800 border border-yellow-200',
  accepted: 'bg-greenlight text-green border border-green/30',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

const CAR_ST: Record<string,string> = {
  active: 'bg-greenlight text-green border border-green/30',
  sold: 'bg-navy text-white border border-navy',
  removed: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function statusLabel(status?: string) {
  if (!status) return 'Active'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function bidStatusLabel(bid: Bid) {
  if (bid.status === 'accepted') {
    if (bid.decisionBy === 'admin') return 'Accepted by admin'
    if (bid.decisionBy === 'seller') return 'Accepted by seller'
    return 'Accepted'
  }
  if (bid.status === 'rejected') {
    if (bid.decisionBy === 'admin') return 'Rejected by admin'
    if (bid.decisionBy === 'seller') return 'Rejected by seller'
    return 'Rejected'
  }
  return 'Pending'
}

export function AdminDashboardClient() {
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [currentUser, setCurrentUser] = useState<User|null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [tab, setTab] = useState<'cars'|'pending'|'accepted'|'rejected'|'sold'>('cars')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingBidId, setUpdatingBidId] = useState('')
  const [updatingCarId, setUpdatingCarId] = useState('')

  useEffect(() => {
    return onAuthChange((u) => {
      setCurrentUser(u)
      if (isAdminIdentity(u)) setAdminSession()
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!authChecked) return

    const canOpenAdmin = hasAdminSession() || isAdminIdentity(currentUser)
    if (!canOpenAdmin) {
      router.replace('/login?admin=true')
      return
    }

    async function load() {
      setLoading(true)
      setError('')
      try {
        if (isAdminIdentity(currentUser)) {
          const [allCars, allBids] = await Promise.all([getAllCars(), getAllBidsForAdmin()])
          const ids = [
            ...allCars.map(car => car.sellerId),
            ...allBids.map(bid => bid.buyerId),
            ...allBids.map(bid => bid.sellerId),
          ]
          setCars(allCars)
          setBids(allBids)
          setProfiles(await getUserProfiles(ids))
          return
        }

        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 2500)
        const response = await fetch('/api/admin/dashboard', {
          cache: 'no-store',
          signal: controller.signal,
        }).finally(() => window.clearTimeout(timeout))
        const result = await response.json().catch(() => ({}))
        if (response.status === 401) {
          clearAdminSession()
          router.replace('/login?admin=true')
          return
        }
        if (!response.ok) {
          throw new Error(result.error || 'Could not load admin data.')
        }
        setCars(result.cars ?? [])
        setBids(result.bids ?? [])
        setProfiles(result.profiles ?? {})
      } catch (loadError) {
        const timedOut = loadError instanceof Error && loadError.name === 'AbortError'
        const missingAdminCredentials = loadError instanceof Error && loadError.message.includes('Firebase Admin credentials are missing')
        if (!timedOut && !missingAdminCredentials) console.error('Admin load error:', loadError)
        const fallbackCars = await getAllCars()
        let fallbackBids: Bid[] = []
        let fallbackProfiles: Record<string, any> = {}
        let privateFallbackWorked = false

        if (isAdminIdentity(currentUser)) {
          try {
            fallbackBids = await getAllBidsForAdmin()
            const ids = [
              ...fallbackCars.map(car => car.sellerId),
              ...fallbackBids.map(bid => bid.buyerId),
              ...fallbackBids.map(bid => bid.sellerId),
            ]
            fallbackProfiles = await getUserProfiles(ids)
            privateFallbackWorked = true
          } catch (privateFallbackError) {
            console.error('Admin phone fallback load error:', privateFallbackError)
          }
        }

        setCars(fallbackCars)
        setBids(fallbackBids)
        setProfiles(fallbackProfiles)
        setTab('cars')
        const message = timedOut
          ? 'Server admin read timed out.'
          : loadError instanceof Error ? loadError.message : 'Could not load private admin data.'
        setError(
          privateFallbackWorked
            ? `${message} Loaded private admin data with signed-in admin permissions.`
            : `${message} Showing car listings only. Sign in with the admin email or admin phone to see bids and contact numbers, or add Firebase Admin credentials.`
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router, authChecked, currentUser?.email, currentUser?.phoneNumber])

  const carById = useMemo(() => Object.fromEntries(cars.map(car => [car.id, car])), [cars])
  const pending = bids.filter(bid => bid.status === 'pending')
  const accepted = bids.filter(bid => bid.status === 'accepted')
  const rejected = bids.filter(bid => bid.status === 'rejected')
  const soldCars = cars.filter(car => car.status === 'sold')
  const listedUserCount = new Set(cars.map(car => car.sellerId).filter(Boolean)).size
  const bidderUserCount = new Set(bids.map(bid => bid.buyerId).filter(Boolean)).size

  const setBidStatus = async (id: string, status: Extract<BidStatus, 'accepted'|'rejected'>) => {
    setUpdatingBidId(id)
    setError('')
    try {
      if (isAdminIdentity(currentUser)) {
        await updateDoc(doc(db, 'bids', id), { status, decisionBy: 'admin', decidedAt: serverTimestamp(), updatedAt: serverTimestamp() })
        setBids(current => current.map(bid => bid.id === id ? { ...bid, status, decisionBy: 'admin' } : bid))
        return
      }

      const response = await fetch(`/api/admin/bids/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        clearAdminSession()
        router.replace('/login?admin=true')
        return
      }
      if (!response.ok) {
        setError(`${result.error || 'Could not update bid.'} Sign in with the admin email or admin phone, or add Firebase Admin credentials.`)
        return
      }
      setBids(current => current.map(bid => bid.id === id ? { ...bid, status, decisionBy: 'admin' } : bid))
    } catch (updateError) {
      console.error('Admin bid update error:', updateError)
      setError('Could not update bid. Please try again.')
    } finally {
      setUpdatingBidId('')
    }
  }

  const setCarStatus = async (id: string, status: CarStatus) => {
    setUpdatingCarId(id)
    setError('')
    try {
      if (isAdminIdentity(currentUser)) {
        await updateDoc(doc(db, 'cars', id), { status, updatedAt: serverTimestamp() })
        setCars(current => current.map(car => car.id === id ? { ...car, status } : car))
        return
      }

      const response = await fetch(`/api/admin/cars/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        clearAdminSession()
        router.replace('/login?admin=true')
        return
      }
      if (!response.ok) {
        setError(`${result.error || 'Could not update car status.'} Sign in with the admin email or admin phone, or add Firebase Admin credentials.`)
        return
      }
      setCars(current => current.map(car => car.id === id ? { ...car, status } : car))
    } catch (updateError) {
      console.error('Admin car update error:', updateError)
      setError('Could not update car status. Please try again.')
    } finally {
      setUpdatingCarId('')
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null)
    clearAdminSession()
    router.replace('/login?admin=true')
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full"/></div>

  const tabs = [
    { k:'cars', l:'All cars', n:cars.length },
    { k:'pending', l:'Pending bids', n:pending.length },
    { k:'accepted', l:'Accepted bids', n:accepted.length },
    { k:'rejected', l:'Rejected bids', n:rejected.length },
    { k:'sold', l:'Sold cars', n:soldCars.length },
  ] as const

  const visibleBids = tab === 'pending' ? pending : tab === 'accepted' ? accepted : tab === 'rejected' ? rejected : []
  const visibleCars = tab === 'sold' ? soldCars : cars

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-navy text-white rounded-2xl p-6 mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">Vehiqal admin</p>
          <h1 className="font-black text-2xl mt-1">Deal control room</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-black">{listedUserCount}</p>
            <p className="text-blue-300 text-xs">Listed users</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{bidderUserCount}</p>
            <p className="text-blue-300 text-xs">Bid users</p>
          </div>
        </div>
        <button onClick={logout} className="text-blue-300 text-sm hover:text-white">Sign out</button>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {tabs.map(item => (
          <button
            key={item.k}
            onClick={() => setTab(item.k)}
            className={`card p-5 text-center border-2 ${tab===item.k?'border-gold':'border-transparent'}`}
          >
            <div className="text-3xl font-black text-navy">{item.n}</div>
            <div className="text-xs text-gray-400 mt-1">{item.l}</div>
          </button>
        ))}
      </div>

      {tab === 'cars' || tab === 'sold' ? (
        <div className="space-y-4">
          {visibleCars.length === 0 ? <Empty text={tab === 'sold' ? 'No sold cars yet' : 'No cars listed yet'} /> : visibleCars.map(car => {
            const seller = profiles[car.sellerId]
            const sellerName = firstText(seller?.name, car.sellerName, car.sellerId)
            const sellerPhone = firstText(seller?.phone, car.sellerPhone)
            return (
              <div key={car.id} className="card p-4 flex items-center gap-4">
                <div className="w-20 h-16 rounded-xl bg-navylight flex items-center justify-center text-2xl flex-shrink-0">🚗</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">{car.make} {car.model} {car.year}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CAR_ST[car.status || 'active'] ?? CAR_ST.active}`}>{statusLabel(car.status)}</span>
                  </div>
                  <p className="text-navy font-black">{formatPrice(car.price)}</p>
                  <p className="text-gray-400 text-xs">{car.city} · Seller: {sellerName}</p>
                  <p className="text-gray-600 text-sm font-semibold">
                    Seller phone:{' '}
                    {sellerPhone ? <a href={`tel:${sellerPhone}`} className="text-navy hover:underline">{sellerPhone}</a> : <span className="text-gray-400">Not saved</span>}
                  </p>
                </div>
                {sellerPhone && <a href={`tel:${sellerPhone}`} className="btn-outline text-sm !px-4 !py-2">Call seller</a>}
                <div className="flex flex-wrap justify-end gap-2">
                  {car.status !== 'sold' && (
                    <button
                      type="button"
                      disabled={updatingCarId === car.id}
                      onClick={() => setCarStatus(car.id, 'sold')}
                      className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navydark disabled:opacity-50"
                    >
                      Mark sold
                    </button>
                  )}
                  {car.status !== 'removed' && (
                    <button
                      type="button"
                      disabled={updatingCarId === car.id}
                      onClick={() => setCarStatus(car.id, 'removed')}
                      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  {car.status && car.status !== 'active' && (
                    <button
                      type="button"
                      disabled={updatingCarId === car.id}
                      onClick={() => setCarStatus(car.id, 'active')}
                      className="rounded-xl border border-green/30 px-4 py-2 text-sm font-bold text-green hover:bg-greenlight disabled:opacity-50"
                    >
                      Restore
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => window.location.assign(`/cars/${car.id}`)}
                  className="text-navy font-bold text-sm hover:underline"
                >
                  View
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleBids.length === 0 ? <Empty text={`No ${tab} bids`} /> : visibleBids.map(bid => (
            <BidCard
              key={bid.id}
              bid={bid}
              car={carById[bid.carId]}
              buyer={profiles[bid.buyerId]}
              seller={profiles[bid.sellerId]}
              onAccept={() => setBidStatus(bid.id, 'accepted')}
              onReject={() => setBidStatus(bid.id, 'rejected')}
              onMarkSold={() => setCarStatus(bid.carId, 'sold')}
              updating={updatingBidId === bid.id}
              carUpdating={updatingCarId === bid.carId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📋</div><p className="font-semibold">{text}</p></div>
}

function BidCard({ bid, car, buyer, seller, onAccept, onReject, onMarkSold, updating, carUpdating }: {
  bid: Bid; car?: Car; buyer?: any; seller?: any; onAccept: () => void; onReject: () => void; onMarkSold: () => void; updating: boolean; carUpdating: boolean;
}) {
  const buyerName = firstText(buyer?.name, bid.buyerName, 'Buyer')
  const buyerPhone = firstText(buyer?.phone, bid.buyerPhone)
  const sellerName = firstText(seller?.name, bid.sellerName, car?.sellerName, car?.sellerId, bid.sellerId)
  const sellerPhone = firstText(seller?.phone, bid.sellerPhone, car?.sellerPhone)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-gray-900">{bid.carTitle}</p>
          <p className="text-navy font-black text-lg">{formatPrice(bid.amount)}</p>
          <div className="mt-2 grid gap-1 text-sm">
            <p className="text-gray-600">
              Buyer: <span className="font-semibold text-gray-900">{buyerName}</span>
              {' '}· Phone:{' '}
              {buyerPhone ? <a href={`tel:${buyerPhone}`} className="font-semibold text-navy hover:underline">{buyerPhone}</a> : <span className="text-gray-400">Not saved</span>}
            </p>
            <p className="text-gray-600">
              Seller: <span className="font-semibold text-gray-900">{sellerName}</span>
              {' '}· Phone:{' '}
              {sellerPhone ? <a href={`tel:${sellerPhone}`} className="font-semibold text-navy hover:underline">{sellerPhone}</a> : <span className="text-gray-400">Not saved</span>}
            </p>
          </div>
          {bid.message && <p className="text-gray-400 text-sm mt-2">{bid.message}</p>}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ST[bid.status]??ST.pending}`}>{bidStatusLabel(bid)}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mt-4">
        <button
          type="button"
          onClick={() => window.location.assign(`/cars/${bid.carId}`)}
          className="btn-outline justify-center text-sm !px-3 !py-2"
        >
          View car
        </button>
        {buyerPhone && <a href={`tel:${buyerPhone}`} className="btn-outline justify-center text-sm !px-3 !py-2">Call buyer</a>}
        {sellerPhone && <a href={`tel:${sellerPhone}`} className="btn-outline justify-center text-sm !px-3 !py-2">Call seller</a>}
        {bid.status === 'accepted' && (
          car?.status === 'sold'
            ? <button type="button" disabled className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white opacity-70">Sold</button>
            : <button
                type="button"
                onClick={onMarkSold}
                disabled={carUpdating}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navydark disabled:opacity-50"
              >
                {carUpdating ? 'Saving...' : 'Mark sold'}
              </button>
        )}
        <button onClick={onAccept} disabled={updating || bid.status==='accepted'} className="rounded-xl bg-green px-4 py-2 text-sm font-bold text-white hover:bg-[#158759] disabled:opacity-45">{updating ? 'Saving...' : 'Accept'}</button>
        <button onClick={onReject} disabled={updating || bid.status==='rejected'} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-45">{updating ? 'Saving...' : 'Reject'}</button>
      </div>
    </div>
  )
}
