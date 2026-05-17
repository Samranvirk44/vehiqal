import {
  collection, doc, getDoc, getDocs, addDoc,
  query, orderBy, limit, where, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type CarStatus = 'active' | 'sold' | 'removed'
export type BidStatus = 'pending' | 'accepted' | 'rejected'

export interface Car {
  id: string; make: string; model: string; year: string;
  price: number; mileage: number; city: string; transmission: string;
  engineSize?: string; colour?: string; description?: string;
  images: string[]; isTrusted: boolean; overallScore?: number;
  sellerId: string; sellerName?: string; sellerPhone?: string;
  status?: CarStatus | string; createdAt?: any;
}

export interface Bid {
  id: string; carId: string; buyerId: string; buyerName: string; buyerPhone?: string;
  sellerId: string; sellerName?: string; sellerPhone?: string;
  carTitle: string; amount: number; message?: string; status: BidStatus | string;
  decisionBy?: 'admin' | 'seller' | string; createdAt?: any; decidedAt?: any;
}

export const CITIES = [
  'Gujranwala','Lahore','Sialkot','Gujrat','Sheikhupura',
  'Karachi','Islamabad','Rawalpindi','Faisalabad','Peshawar','Multan','Quetta'
]
export const CITIES_WITH_ALL = ['All', ...CITIES]
export const MAKES = ['Toyota','Honda','Suzuki','Kia','Hyundai','Mitsubishi','Nissan','Daihatsu','Changan','MG','Other']
export const MAKES_WITH_ALL = ['All', ...MAKES]

function createdAtMillis(value: any) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function newestFirst<T extends Record<string, any>>(items: T[]) {
  return items.sort((a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt))
}

export async function getCars({ city, trustedOnly, makeFilter, pageLimit = 20 }: {
  city?: string; trustedOnly?: boolean; makeFilter?: string; pageLimit?: number
} = {}): Promise<Car[]> {
  try {
    // Simple query — no composite index needed
    // Just get all cars ordered by createdAt, filter in memory
    const snap = await getDocs(query(
      collection(db, 'cars'),
      orderBy('createdAt', 'desc'),
      limit(100)
    ))
    let r = snap.docs.map(d => ({ id: d.id, ...d.data() } as Car))
    // Filter in memory — no index required
    r = r.filter(c => c.status === 'active' || !c.status) // include older docs without status
    if (city && city !== 'All') r = r.filter(c => c.city === city)
    if (trustedOnly) r = r.filter(c => c.isTrusted)
    if (makeFilter && makeFilter !== 'All') r = r.filter(c => c.make === makeFilter)
    // Sort trusted first
    r.sort((a, b) => (b.isTrusted ? 1 : 0) - (a.isTrusted ? 1 : 0))
    return r.slice(0, pageLimit)
  } catch (e) {
    console.error('getCars error:', e)
    // Last resort — get everything
    try {
      const snap = await getDocs(collection(db, 'cars'))
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Car))
        .filter(c => c.status === 'active' || !c.status)
        .slice(0, pageLimit)
    } catch { return [] }
  }
}

export async function getCarById(id: string): Promise<Car | null> {
  try {
    const snap = await getDoc(doc(db, 'cars', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } as Car : null
  } catch (e) {
    console.error('getCarById error:', e)
    return null
  }
}

export async function createCar(data: Partial<Car>) {
  return addDoc(collection(db, 'cars'), {
    ...data,
    status: 'active',
    isTrusted: false,
    overallScore: null,
    views: 0,
    images: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCar(id: string, data: Partial<Car>) {
  return updateDoc(doc(db, 'cars', id), { ...data, updatedAt: serverTimestamp() })
}

export async function placeBid({ carId, buyerId, buyerName, buyerPhone, sellerId, sellerName, sellerPhone, carTitle, amount, message }: {
  carId: string; buyerId: string; buyerName: string; buyerPhone?: string;
  sellerId: string; sellerName?: string; sellerPhone?: string;
  carTitle: string; amount: number; message?: string
}) {
  return addDoc(collection(db, 'bids'), {
    carId, buyerId, buyerName, buyerPhone: buyerPhone || '',
    sellerId, sellerName: sellerName || '', sellerPhone: sellerPhone || '',
    carTitle,
    amount, message: message || '', status: 'pending', createdAt: serverTimestamp(),
  })
}

export async function getUserBids(userId: string) {
  try {
    const snap = await getDocs(query(collection(db, 'bids'), where('buyerId', '==', userId)))
    return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bid)))
  } catch (e) {
    console.error('getUserBids error:', e)
    try {
      const snap = await getDocs(collection(db, 'bids'))
      return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bid))).filter(b => b.buyerId === userId)
    } catch { return [] }
  }
}

export async function getSellerBids(sellerId: string) {
  try {
    const snap = await getDocs(query(collection(db, 'bids'), where('sellerId', '==', sellerId)))
    return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bid)))
  } catch (e) {
    console.error('getSellerBids error:', e)
    try {
      const snap = await getDocs(collection(db, 'bids'))
      return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bid))).filter(b => b.sellerId === sellerId)
    } catch { return [] }
  }
}

export async function getCarsByUser(userId: string): Promise<Car[]> {
  try {
    const snap = await getDocs(query(collection(db, 'cars'), where('sellerId', '==', userId)))
    return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)))
  } catch (e) {
    console.error('getCarsByUser error:', e)
    try {
      const snap = await getDocs(collection(db, 'cars'))
      return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car))).filter(car => car.sellerId === userId)
    } catch { return [] }
  }
}

export async function getAllCars(): Promise<Car[]> {
  try {
    const snap = await getDocs(collection(db, 'cars'))
    return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)))
  } catch (e) {
    console.error('getAllCars error:', e)
    return []
  }
}

export async function getAllBids(): Promise<Bid[]> {
  try {
    const snap = await getDocs(collection(db, 'bids'))
    return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bid)))
  } catch (e) {
    console.error('getAllBids error:', e)
    return []
  }
}

export async function getAllBidsForAdmin(): Promise<Bid[]> {
  const snap = await getDocs(collection(db, 'bids'))
  return newestFirst(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bid)))
}

export function formatPrice(price: number): string {
  const lacs = price / 100000
  return lacs >= 1
    ? `PKR ${lacs % 1 === 0 ? lacs.toFixed(0) : lacs.toFixed(1)} lac`
    : `PKR ${price.toLocaleString()}`
}
