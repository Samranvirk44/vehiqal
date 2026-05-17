'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { onAuthChange, getUserProfile, signOut } from '@/lib/auth'
import { getCarsByUser, getUserBids, getSellerBids, formatPrice, type Bid, type Car } from '@/lib/cars'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'

const ST: Record<string,string> = {
  pending:  'bg-yellow-50 text-yellow-800 border border-yellow-200',
  accepted: 'bg-green-50 text-green-800 border border-green-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

const CAR_ST: Record<string,string> = {
  active: 'bg-greenlight text-green border border-green/30',
  sold: 'bg-navy text-white border border-navy',
  removed: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function titleCase(value?: string) {
  if (!value) return 'Active'
  return value.charAt(0).toUpperCase() + value.slice(1)
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

export function DashboardClient() {
  const router = useRouter()
  const [user, setUser]         = useState<User|null>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [tab, setTab]           = useState<'listings'|'sold'|'bids'|'incoming'>('listings')
  const [listings, setListings] = useState<Car[]>([])
  const [myBids, setMyBids]     = useState<Bid[]>([])
  const [sBids, setSBids]       = useState<Bid[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    return onAuthChange(async (u) => {
      if (!u) { router.push('/login'); return }
      setUser(u)
      setLoading(true)
      setLoadError('')
      try {
        const [p,c,b,s] = await Promise.all([getUserProfile(u.uid),getCarsByUser(u.uid),getUserBids(u.uid),getSellerBids(u.uid)])
        setProfile(p)
        setListings(c)
        setMyBids(b)
        setSBids(s)
      } catch (error) {
        console.error('Dashboard load error:', error)
        setLoadError('Could not load dashboard data. Please refresh and try again.')
      } finally {
        setLoading(false)
      }
    })
  },[router])

  const handleBid = async (id: string, status: 'accepted'|'rejected') => {
    await updateDoc(doc(db,'bids',id),{status, decisionBy: 'seller', decidedAt: serverTimestamp(), updatedAt: serverTimestamp()})
    setSBids(p => p.map(b => b.id===id?{...b,status,decisionBy:'seller'}:b))
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full"/></div>

  const initials = profile?.name?.charAt(0)?.toUpperCase() || '?'
  const pending  = sBids.filter(b=>b.status==='pending').length
  const soldListings = listings.filter(car => car.status === 'sold')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="bg-navy text-white rounded-2xl p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center text-yellow-900 font-black text-2xl">{initials}</div>
          <div><h1 className="font-black text-xl">{profile?.name || 'My account'}</h1><p className="text-blue-300 text-sm">{user?.phoneNumber}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sell" className="btn-gold text-sm !px-4 !py-2">+ List car</Link>
          <button onClick={()=>signOut().then(()=>router.push('/'))} className="text-blue-300 text-sm hover:text-white">Sign out</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{n:listings.length,l:'My listings'},{n:soldListings.length,l:'Sold cars'},{n:myBids.length,l:'Bids placed'},{n:pending,l:'Incoming bids',hi:pending>0}].map(st=>(
          <div key={st.l} className={`card p-5 text-center ${st.hi?'border-2 border-gold':''}`}>
            <div className={`text-3xl font-black ${st.hi?'text-gold':'text-navy'}`}>{st.n}</div>
            <div className="text-xs text-gray-400 mt-1">{st.l}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-6">
        {[{k:'listings',l:'My listings'},{k:'sold',l:`Sold cars${soldListings.length>0?` (${soldListings.length})`:''}`},{k:'bids',l:'My bids'},{k:'incoming',l:`Incoming${pending>0?` (${pending})`:''}`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${tab===t.k?'border-navy text-navy':'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.l}</button>
        ))}
      </div>

      {tab==='listings'&&(
        <div className="space-y-4">
          {listings.length===0
            ?<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">🚗</div><p className="font-semibold">No listings yet</p><Link href="/sell" className="btn-navy mt-4 text-sm">List your first car</Link></div>
            :listings.map(car=>(
              <div key={car.id} className="card p-4 flex items-center gap-4">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-navylight flex-shrink-0">
                  {car.images?.[0]?<Image src={car.images[0]} alt="" width={80} height={64} className="object-cover w-full h-full"/>:<div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">{car.make} {car.model} {car.year}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CAR_ST[car.status || 'active'] ?? CAR_ST.active}`}>{titleCase(car.status)}</span>
                  </div>
                  <p className="text-navy font-black">{formatPrice(car.price)}</p>
                  <p className="text-gray-400 text-xs">{car.city}</p>
                </div>
                <Link href={`/cars/${car.id}`} className="text-navy font-bold text-sm hover:underline">View →</Link>
              </div>
            ))
          }
        </div>
      )}

      {tab==='sold'&&(
        <div className="space-y-4">
          {soldListings.length===0
            ?<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">✓</div><p className="font-semibold">No sold cars yet</p></div>
            :soldListings.map(car=>(
              <div key={car.id} className="card p-4 flex items-center gap-4 border-navy/10">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-navylight flex-shrink-0">
                  {car.images?.[0]?<Image src={car.images[0]} alt="" width={80} height={64} className="object-cover w-full h-full"/>:<div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">{car.make} {car.model} {car.year}</p>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-navy text-white">Sold</span>
                  </div>
                  <p className="text-navy font-black">{formatPrice(car.price)}</p>
                  <p className="text-gray-400 text-xs">{car.city}</p>
                </div>
                <Link href={`/cars/${car.id}`} className="text-navy font-bold text-sm hover:underline">View →</Link>
              </div>
            ))
          }
        </div>
      )}

      {tab==='bids'&&(
        <div className="space-y-4">
          {myBids.length===0
            ?<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">💰</div><p className="font-semibold">No bids yet</p><Link href="/cars" className="btn-navy mt-4 text-sm">Browse cars</Link></div>
            :myBids.map((b:any)=>(
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold text-gray-900">{b.carTitle}</p><p className="text-navy font-black text-lg">{formatPrice(b.amount)}</p></div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ST[b.status]??ST.pending}`}>{bidStatusLabel(b)}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab==='incoming'&&(
        <div className="space-y-4">
          {sBids.length===0
            ?<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📥</div><p className="font-semibold">No incoming bids yet</p></div>
            :sBids.map((b:any)=>(
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div><p className="font-bold text-gray-900">{b.carTitle}</p><p className="text-gray-500 text-sm">From: {b.buyerName}</p><p className="text-navy font-black text-lg">{formatPrice(b.amount)}</p></div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ST[b.status]??ST.pending}`}>{bidStatusLabel(b)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={()=>handleBid(b.id,'accepted')}
                    disabled={b.status==='accepted'}
                    className="rounded-xl bg-green px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#158759] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Accept
                  </button>
                  <button
                    onClick={()=>handleBid(b.id,'rejected')}
                    disabled={b.status==='rejected'}
                    className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
