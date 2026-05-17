'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { placeBid, formatPrice, type Car } from '@/lib/cars'
import { onAuthChange, getUserProfile } from '@/lib/auth'
import type { User } from 'firebase/auth'

export function BidForm({ car }: { car: Car }) {
  const [user, setUser]       = useState<User|null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [amount, setAmount]   = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    return onAuthChange(async (u) => {
      setUser(u)
      if (u) { const p = await getUserProfile(u.uid); setProfile(p) }
    })
  }, [])

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount||Number(amount)<1){setError('Enter a valid bid amount.');return}
    if (!user){setError('Please sign in.');return}
    if (user.uid === car.sellerId){setError('You cannot bid on your own listed car.');return}
    setLoading(true); setError('')
    try {
      await placeBid({
        carId:car.id,
        buyerId:user.uid,
        buyerName:profile?.name??'Buyer',
        buyerPhone:profile?.phone??user.phoneNumber??'',
        sellerId:car.sellerId,
        sellerName:car.sellerName??'Seller',
        sellerPhone:car.sellerPhone??'',
        carTitle:`${car.make} ${car.model} ${car.year}`,
        amount:Number(amount)*100000,
        message:message.trim(),
      })
      setSuccess(true)
    } catch { setError('Could not submit. Try again.') }
    finally { setLoading(false) }
  }

  if (success) return (
    <div className="card p-6 text-center">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="font-black text-gray-900 text-lg mb-2">Bid submitted!</h3>
      <p className="text-gray-500 text-sm mb-4">Vehiqal will review and notify you soon.</p>
      <Link href="/dashboard" className="btn-navy text-sm w-full justify-center">View my bids</Link>
    </div>
  )

  if (car.status === 'sold') return (
    <div className="card p-6 text-center">
      <div className="text-4xl mb-3">✓</div>
      <h2 className="font-black text-gray-900 text-xl mb-2">This car is sold</h2>
      <p className="text-gray-500 text-sm mb-4">Bidding is closed for this listing.</p>
      <Link href="/cars" className="btn-navy text-sm w-full justify-center">Browse other cars</Link>
    </div>
  )

  return (
    <div className="card p-6">
      <h2 className="font-black text-gray-900 text-xl mb-1">Place a bid</h2>
      <p className="text-gray-400 text-sm mb-5">Asking: <strong className="text-navy">{formatPrice(car.price)}</strong></p>
      {!user ? (
        <div className="text-center py-2">
          <p className="text-gray-500 text-sm mb-4">Sign in to place a bid</p>
          <Link href={`/login?redirect=/cars/${car.id}`} className="btn-navy w-full justify-center">Sign in to bid</Link>
          <p className="text-gray-400 text-xs mt-3">Or call: <a href="tel:+923114642679" className="text-navy font-bold">0311 4642679</a></p>
        </div>
      ) : user.uid === car.sellerId ? (
        <div className="text-center py-2">
          <p className="text-gray-500 text-sm mb-4">This is your own listing.</p>
          <button type="button" disabled className="btn-navy w-full justify-center opacity-50 cursor-not-allowed">You cannot bid on this car</button>
        </div>
      ) : (
        <form onSubmit={handleBid} className="space-y-4">
          <div>
            <label className="label">Your bid (lacs PKR)</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-navy">
              <span className="bg-gray-50 px-3 py-3.5 text-gray-400 text-sm border-r">PKR</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`e.g. ${Math.floor(car.price/100000*0.95)}`} className="flex-1 px-3 py-3.5 text-lg font-bold text-gray-800 focus:outline-none" min="1" step="0.5"/>
              <span className="bg-gray-50 px-3 py-3.5 text-gray-400 text-sm border-l">lacs</span>
            </div>
            {amount && <p className="text-green-600 text-xs mt-1 font-medium">= PKR {(Number(amount)*100000).toLocaleString('en-PK')}</p>}
          </div>
          <div>
            <label className="label">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Serious buyer, ready this week..." rows={3} className="input resize-none text-sm"/>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="bg-navylight rounded-xl p-3 text-xs text-navy">🛡️ Bid reviewed by Vehiqal. We manage the entire deal process.</div>
          <button type="submit" disabled={loading} className="btn-navy w-full justify-center disabled:opacity-60">{loading?'Submitting…':'Submit bid'}</button>
        </form>
      )}
    </div>
  )
}
