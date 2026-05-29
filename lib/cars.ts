import {
  collection, doc, getDoc, getDocs, addDoc,
  query, orderBy, limit, where, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type CarStatus = 'active' | 'sold' | 'removed'
export type BidStatus = 'pending' | 'accepted' | 'rejected'
export type VerificationStatus = 'none' | 'requested' | 'inspecting' | 'verified' | 'rejected'

export interface InspectionSectionResult {
  id: string
  title: string
  points: number
  score: number | null
  weightedScore?: number
  notes?: string
}

export interface InspectionReport {
  status?: 'in_progress' | 'completed'
  version?: string
  totalPoints: number
  overallScore: number | null
  sections: InspectionSectionResult[]
  inspectedBy?: string
  startedAt?: any
  updatedAt?: any
  completedAt?: any
}

export interface Car {
  id: string; make: string; model: string; year: string;
  price: number; mileage: number; city: string; transmission: string;
  engineSize?: string; colour?: string; description?: string;
  fuelType?: string; condition?: string; assembly?: string; features?: string[];
  images: string[]; isTrusted: boolean; overallScore?: number;
  sellerId: string; sellerName?: string; sellerPhone?: string;
  status?: CarStatus | string; verificationStatus?: VerificationStatus | string;
  inspectionReport?: InspectionReport;
  verificationRequestedAt?: any; verifiedAt?: any; verifiedBy?: string;
  createdAt?: any;
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
export const MAKES = [
  'Toyota',
  'Honda',
  'Suzuki',
  'Hyundai',
  'Kia',
  'Changan',
  'MG',
  'DFSK',
  'BYD',
  'Deepal',
  'Haval',
  'Jetour',
  'Proton',
  'FAW',
  'JAC',
  'Peugeot',
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Isuzu',
  'Hino',
  'Nissan',
  'Mitsubishi Motors',
  'Mazda',
  'Chevrolet',
  'Ford Motor Company',
  'Tesla',
  'Daihatsu',
  'Other',
]
export const MAKES_WITH_ALL = ['All', ...MAKES]
export const CAR_MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota:[
    'Corolla XLi',
    'Corolla GLi',
    'Corolla Altis',
    'Corolla Grande',
    'Yaris GLi',
    'Yaris ATIV',
    'Fortuner',
    'Hilux Revo',
    'Hilux Vigo',
    'Land Cruiser',
    'Prado',
    'Aqua',
    'Vitz',
    'Passo',
    'Prius',
    'Belta',
    'Surf',
    'Raize',
    'C-HR',
    'Camry',
    'Crown',
    'Hiace',
    'Coaster',
  ],
  Honda:[
    'Civic EXi',
    'Civic VTi Oriel',
    'Civic Reborn',
    'Civic Rebirth',
    'Civic X',
    'Civic RS',
    'City i-DSI',
    'City Aspire',
    'BR-V',
    'HR-V',
    'Vezel',
    'Fit',
    'N-One',
    'N-WGN',
    'N-Box',
    'Accord',
    'CR-V',
  ],
  Suzuki:[
    'Mehran VX',
    'Mehran VXR',
    'Alto VX',
    'Alto VXR',
    'Alto VXL',
    'Cultus VXR',
    'Cultus VXL',
    'Wagon R VXR',
    'Wagon R VXL',
    'Swift DLX',
    'Swift GL',
    'Swift GLX',
    'Bolan',
    'Ravi',
    'Every',
    'Khyber',
    'Margalla',
    'Baleno',
    'Liana',
    'Ciaz',
    'APV',
    'Jimny',
    'Vitara',
    'Hustler',
    'Spacia',
  ],
  Hyundai:[
    'Tucson',
    'Elantra',
    'Sonata',
    'Santro',
    'Shehzore',
    'Porter',
    'Staria',
    'Ioniq',
    'Santa Fe',
  ],
  Kia:[
    'Sportage',
    'Picanto',
    'Stonic',
    'Sorento',
    'Carnival',
    'Grand Carnival',
    'Classic',
    'Niro',
    'EV5',
    'EV9',
  ],
  Changan:[
    'Alsvin',
    'Oshan X7',
    'Karvaan',
    'M9',
    'Lumin',
    'Hunter',
  ],
  MG:[
    'HS',
    'HS PHEV',
    'ZS',
    'ZS EV',
    'MG 3',
    'MG 4',
    'MG 5',
    'Marvel R',
  ],
  DFSK:[
    'Glory 580',
    'Glory 500',
    'Glory 330',
    'C37',
    'K07S',
  ],
  BYD:[
    'Atto 3',
    'Seal',
    'Dolphin',
    'Sealion 6',
    'Tang',
    'Han',
  ],
  Deepal:[
    'S07',
    'L07',
  ],
  Haval:[
    'H6',
    'H6 HEV',
    'Jolion',
    'Jolion HEV',
  ],
  Jetour:[
    'Dashing',
    'X70 Plus',
    'X90 Plus',
  ],
  Proton:[
    'Saga',
    'X70',
  ],
  FAW:[
    'V2',
    'X-PV',
    'Carrier',
    'Sirius',
  ],
  JAC:[
    'T6',
    'T8',
    'X200',
    'Sunray',
  ],
  Peugeot:[
    '2008',
    '3008',
    '5008',
  ],
  Audi:[
    'A3',
    'A4',
    'A5',
    'A6',
    'A7',
    'A8',
    'Q2',
    'Q3',
    'Q5',
    'Q7',
    'e-tron',
  ],
  BMW:[
    '3 Series',
    '5 Series',
    '7 Series',
    'X1',
    'X3',
    'X5',
    'X6',
    'iX',
  ],
  'Mercedes-Benz':[
    'C-Class',
    'E-Class',
    'S-Class',
    'CLA',
    'GLA',
    'GLC',
    'GLE',
    'GLS',
    'Vito',
  ],
  Isuzu:[
    'D-Max',
    'D-Max V-Cross',
    'MU-X',
    'N-Series',
  ],
  Hino:[
    '300 Series',
    '500 Series',
    'Dutro',
    'Ranger',
  ],
  Nissan:[
    'Dayz',
    'Roox',
    'Note',
    'Juke',
    'March',
    'Sunny',
    'AD Van',
    'Bluebird',
    'Patrol',
    'Navara',
    'Clipper',
  ],
  'Mitsubishi Motors':[
    'Lancer',
    'Pajero',
    'Pajero Mini',
    'Galant',
    'Mirage',
    'EK Wagon',
    'Minicab',
    'Outlander',
    'Triton',
    'Delica',
  ],
  Mazda:[
    'Demio',
    'Axela',
    'Atenza',
    'Carol',
    'Scrum',
    'RX-8',
    'CX-3',
    'CX-5',
    'Bongo',
  ],
  Chevrolet:[
    'Joy',
    'Exclusive',
    'Cruze',
    'Optra',
    'Spark',
    'Aveo',
  ],
  'Ford Motor Company':[
    'Ranger',
    'Raptor',
    'F-150',
    'Mustang',
    'Explorer',
    'Focus',
    'Fiesta',
  ],
  Tesla:[
    'Model 3',
    'Model Y',
    'Model S',
    'Model X',
  ],
  Daihatsu:[
    'Mira',
    'Move',
    'Cuore',
    'Hijet',
    'Terios',
    'Boon',
    'Cast',
    'Tanto',
    'Rocky',
    'Charade',
  ],
}

export function getCarModelOptions(make?: string | null) {
  if (!make) return []
  const normalized = make.trim().toLowerCase()
  const match = Object.entries(CAR_MODELS_BY_MAKE)
    .find(([brand]) => brand.toLowerCase() === normalized)
  return match ? match[1] : []
}

export const FUEL_TYPES = ['Petrol','Diesel','EV','Other']
export const CAR_CONDITIONS = ['Used','New','Used like New','Brand New','Not Good']
export const ASSEMBLY_TYPES = ['Local','Imported']
export const CAR_FEATURES = [
  'LED/Matrix Headlight',
  'Alloy Wheels',
  'Sunroof',
  'Panoramic roof',
  'Parking sensors',
  'Rear camera',
  'Fog lamps',
  'Infotainment system',
  'Climate control',
  'Leather or fabric seats',
  'Airbags',
  'ABS',
  'ESC',
  'Lane Departure Warning',
  'Blind spot monitoring',
  'All-Wheel drive (AWD)',
  'Wireless Charging',
  'Push-button start',
  'Keyless entry',
  'Remote engine start',
  'Cruise control',
  'Adaptive cruise control',
  'Automatic climate control',
  'Dual-zone climate control',
  'Air purifier',
  'Auto-dimming mirrors',
  'Power tailgate',
  'Gesture-controlled tailgate',
  '360° camera',
  'Electric parking brake',
  'Digital instrument cluster',
  'Touchscreen infotainment',
  'Ambient lighting',
  'Leather seats',
  'Ventilated seats',
  'Heated seats',
  'Electric seat adjustment',
  'Memory seats',
  'Rear AC vents',
  'Multi-color cabin lighting',
  'Foldable rear seats',
  'Cooled glove box',
  'Heads-up display (HUD)',
] as const
export const INSPECTION_SECTIONS = [
  { id:'engine_drivetrain', title:'Engine & Drivetrain', points:42 },
  { id:'transmission_clutch', title:'Transmission & Clutch', points:28 },
  { id:'suspension_steering', title:'Suspension & Steering', points:35 },
  { id:'body_paint_frame', title:'Body, Paint & Frame', points:38 },
  { id:'interior_comfort', title:'Interior & Comfort', points:40 },
  { id:'electricals_ac', title:'Electricals & AC', points:36 },
  { id:'tyres_brakes', title:'Tyres & Brakes', points:28 },
  { id:'safety_adas', title:'Safety & ADAS', points:22 },
  { id:'documents_history', title:'Documents & History', points:16 },
  { id:'road_test', title:'Road Test', points:15 },
] as const
export const CAR_COLOURS = [
  { name:'White', hex:'#F8FAFC' },
  { name:'Pearl White', hex:'#FFFDF3' },
  { name:'Black', hex:'#111827' },
  { name:'Silver', hex:'#C0C0C0' },
  { name:'Grey', hex:'#808080' },
  { name:'Graphite Grey', hex:'#4B5563' },
  { name:'Gun Metallic', hex:'#3F4752' },
  { name:'Red', hex:'#DC2626' },
  { name:'Maroon', hex:'#7F1D1D' },
  { name:'Blue', hex:'#2563EB' },
  { name:'Navy Blue', hex:'#1E3A8A' },
  { name:'Sky Blue', hex:'#38BDF8' },
  { name:'Green', hex:'#16A34A' },
  { name:'Dark Green', hex:'#166534' },
  { name:'Beige', hex:'#D6C6A8' },
  { name:'Gold', hex:'#D4A017' },
  { name:'Brown', hex:'#7C4A2D' },
  { name:'Bronze', hex:'#B08D57' },
  { name:'Yellow', hex:'#FACC15' },
  { name:'Orange', hex:'#F97316' },
] as const

export function findCarColourOption(colour?: string | null) {
  if (!colour) return null
  const normalized = colour.trim().toLowerCase()
  return CAR_COLOURS.find(item => item.name.toLowerCase() === normalized) ?? null
}

export function getCarColourOption(colour?: string | null) {
  if (!colour) return null
  return findCarColourOption(colour) ?? { name: colour.trim(), hex:'#CBD5E1' }
}

export function normalizeCarColourName(colour?: string | null) {
  if (!colour) return ''
  return findCarColourOption(colour)?.name ?? colour.trim()
}

export function calculateInspectionScore(sections: Array<{ points: number; score: number | null | undefined }>) {
  const totalPoints = sections.reduce((sum, section) => sum + section.points, 0)
  if (!totalPoints) return 0
  const weighted = sections.reduce((sum, section) => sum + (Number(section.score) || 0) * section.points, 0) / totalPoints
  return Math.round(weighted * 10) / 10
}

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

function listingSort(a: Car, b: Car) {
  const verified = Number(Boolean(b.isTrusted)) - Number(Boolean(a.isTrusted))
  if (verified !== 0) return verified
  return createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt)
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
    r.sort(listingSort)
    return r.slice(0, pageLimit)
  } catch (e) {
    console.error('getCars error:', e)
    // Last resort — get everything
    try {
      const snap = await getDocs(collection(db, 'cars'))
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Car))
        .filter(c => c.status === 'active' || !c.status)
        .sort(listingSort)
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
  const verificationRequested = data.verificationStatus === 'requested'
  return addDoc(collection(db, 'cars'), {
    ...data,
    status: 'active',
    isTrusted: false,
    overallScore: null,
    verificationStatus: verificationRequested ? 'requested' : data.verificationStatus || 'none',
    ...(verificationRequested ? { verificationRequestedAt: serverTimestamp() } : {}),
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
