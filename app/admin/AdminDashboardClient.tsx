'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { browserLocalPersistence, browserSessionPersistence, setPersistence, signInWithEmailAndPassword } from 'firebase/auth'
import { clearAdminSession, hasAdminSession, isAdminEmail, isAdminIdentity, setAdminSession } from '@/lib/admin'
import { getUserProfiles, onAuthChange, signOut as signOutUser } from '@/lib/auth'
import { auth, db } from '@/lib/firebase'
import {
  INSPECTION_SECTIONS,
  calculateInspectionScore,
  getAllBidsForAdmin,
  getAllCars,
  formatPrice,
  type Bid,
  type BidStatus,
  type Car,
  type CarStatus,
  type InspectionSectionResult,
  type VerificationStatus,
} from '@/lib/cars'
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

const VERIFICATION_ST: Record<string,string> = {
  none: 'bg-gray-50 text-gray-500 border border-gray-200',
  requested: 'bg-goldlight text-yellow-800 border border-gold/40',
  inspecting: 'bg-blue-50 text-navy border border-blue-200',
  verified: 'bg-greenlight text-green border border-green/30',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

type InspectionDraftSection = {
  id: string
  title: string
  points: number
  score: string
  notes: string
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

function carImageAlt(car: Car) {
  return `${car.year} ${car.make} ${car.model} in ${car.colour || 'unknown color'} for sale in ${car.city} - admin listing thumbnail`
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

function verificationLabel(car: Car) {
  if (car.isTrusted || car.verificationStatus === 'verified') return 'Inspected'
  if (car.verificationStatus === 'requested') return 'Verification requested'
  if (car.verificationStatus === 'inspecting') return 'Inspection in progress'
  if (car.verificationStatus === 'rejected') return 'Verification rejected'
  return 'Not inspected'
}

function verificationUpdate(status: VerificationStatus) {
  const base: Record<string, any> = {
    verificationStatus: status,
    updatedAt: serverTimestamp(),
  }
  if (status === 'requested') {
    return { ...base, isTrusted: false, verificationRequestedAt: serverTimestamp() }
  }
  if (status === 'inspecting') {
    return { ...base, isTrusted: false, inspectionStartedAt: serverTimestamp() }
  }
  if (status === 'verified') {
    return { ...base, isTrusted: true, verifiedAt: serverTimestamp(), verifiedBy: 'admin' }
  }
  if (status === 'rejected') {
    return { ...base, isTrusted: false, overallScore: null, inspectionReport: null, verificationRejectedAt: serverTimestamp() }
  }
  return { ...base, isTrusted: false, overallScore: null, inspectionReport: null }
}

function buildInspectionDraft(car: Car): InspectionDraftSection[] {
  const savedSections = car.inspectionReport?.sections ?? []
  return INSPECTION_SECTIONS.map(section => {
    const saved = savedSections.find(item => item.id === section.id || item.title === section.title)
    const savedScore = typeof saved?.score === 'number' && Number.isFinite(saved.score) ? String(saved.score) : ''
    return {
      id: section.id,
      title: section.title,
      points: section.points,
      score: savedScore,
      notes: saved?.notes ?? '',
    }
  })
}

function draftToReportSections(draft: InspectionDraftSection[]): InspectionSectionResult[] {
  const totalPoints = INSPECTION_SECTIONS.reduce((sum, section) => sum + section.points, 0)
  return draft.map(section => {
    const score = section.score === '' ? null : Number(section.score)
    return {
      id: section.id,
      title: section.title,
      points: section.points,
      score,
      weightedScore: score === null ? 0 : Math.round(((score * section.points) / totalPoints) * 100) / 100,
      notes: section.notes.trim(),
    }
  })
}

function draftOverallScore(draft: InspectionDraftSection[]) {
  return calculateInspectionScore(draft.map(section => ({
    points: section.points,
    score: section.score === '' ? null : Number(section.score),
  })))
}

function draftComplete(draft: InspectionDraftSection[]) {
  return draft.every(section => {
    const score = Number(section.score)
    return Number.isFinite(score) && score >= 1 && score <= 10
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export function AdminDashboardClient() {
  const [cars, setCars] = useState<Car[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [currentUser, setCurrentUser] = useState<User|null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [adminSessionVersion, setAdminSessionVersion] = useState(0)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<'cars'|'verified'|'pending'|'accepted'|'rejected'|'sold'>('cars')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingBidId, setUpdatingBidId] = useState('')
  const [updatingCarId, setUpdatingCarId] = useState('')
  const [activeInspectionCarId, setActiveInspectionCarId] = useState('')
  const [inspectionDrafts, setInspectionDrafts] = useState<Record<string, InspectionDraftSection[]>>({})
  const canOpenAdmin = authChecked && (hasAdminSession() || isAdminIdentity(currentUser))

  useEffect(() => {
    return onAuthChange((u) => {
      setCurrentUser(u)
      if (isAdminIdentity(u)) setAdminSession()
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!authChecked) return

    if (!canOpenAdmin) {
      setCars([])
      setBids([])
      setProfiles({})
      setError('')
      setLoading(false)
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
          setAdminSessionVersion(version => version + 1)
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
  }, [canOpenAdmin, authChecked, currentUser?.email, currentUser?.phoneNumber, adminSessionVersion])

  const expireAdminSession = () => {
    clearAdminSession()
    setCars([])
    setBids([])
    setProfiles({})
    setError('Admin session expired. Sign in again.')
    setAdminSessionVersion(version => version + 1)
  }

  const adminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    const username = adminUser.trim() || 'admin'
    const password = adminPass

    try {
      const normalizedUsername = username.toLowerCase()
      const firebaseEmail = username.includes('@')
        ? username
        : ['admin', 'vehiqaladmin'].includes(normalizedUsername) ? 'admin.vehiqal@gmail.com' : ''

      if (firebaseEmail) {
        try {
          await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence)
          const credential = await withTimeout(
            signInWithEmailAndPassword(auth, firebaseEmail, password),
            username.includes('@') ? 10000 : 3000
          )
          if (!isAdminEmail(credential.user.email)) {
            await signOutUser().catch(() => null)
            setLoginError('This email is not allowed as admin.')
            return
          }
          setAdminSession()
          setCurrentUser(credential.user)
          setAdminPass('')
          setLoading(true)
          setAdminSessionVersion(version => version + 1)
          return
        } catch (emailLoginError) {
          if (username.includes('@')) throw emailLoginError
        }
      }

      const response = await fetch('/api/admin/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ username, password }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setLoginError(result.error || 'Invalid admin username or password.')
        return
      }

      setAdminSession()
      setAdminPass('')
      setLoading(true)
      setAdminSessionVersion(version => version + 1)
    } catch (loginError: any) {
      if (loginError?.code === 'auth/invalid-credential' || loginError?.code === 'auth/user-not-found' || loginError?.code === 'auth/wrong-password') {
        setLoginError('Invalid admin email or password.')
      } else if (loginError?.code === 'auth/operation-not-allowed') {
        setLoginError('Email/password login is not enabled in Firebase Auth.')
      } else {
        setLoginError('Could not open admin dashboard. Please try again.')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const carById = useMemo(() => Object.fromEntries(cars.map(car => [car.id, car])), [cars])
  const pending = bids.filter(bid => bid.status === 'pending')
  const accepted = bids.filter(bid => bid.status === 'accepted')
  const rejected = bids.filter(bid => bid.status === 'rejected')
  const soldCars = cars.filter(car => car.status === 'sold')
  const verificationRequests = cars.filter(car => ['requested','inspecting'].includes(String(car.verificationStatus)) && !car.isTrusted)
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
        expireAdminSession()
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
        expireAdminSession()
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

  const setCarVerification = async (id: string, verificationStatus: VerificationStatus) => {
    setUpdatingCarId(id)
    setError('')
    try {
      const updates = verificationUpdate(verificationStatus)
      if (isAdminIdentity(currentUser)) {
        await updateDoc(doc(db, 'cars', id), updates)
        setCars(current => current.map(car => car.id === id ? {
          ...car,
          verificationStatus,
          isTrusted: verificationStatus === 'verified',
          overallScore: ['none','rejected'].includes(verificationStatus) ? undefined : car.overallScore,
          inspectionReport: ['none','rejected'].includes(verificationStatus) ? undefined : car.inspectionReport,
        } : car))
        return
      }

      const response = await fetch(`/api/admin/cars/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus }),
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        expireAdminSession()
        return
      }
      if (!response.ok) {
        setError(`${result.error || 'Could not update verification.'} Sign in with the admin email or admin phone, or add Firebase Admin credentials.`)
        return
      }
      setCars(current => current.map(car => car.id === id ? {
        ...car,
        verificationStatus,
        isTrusted: verificationStatus === 'verified',
        overallScore: ['none','rejected'].includes(verificationStatus) ? undefined : car.overallScore,
        inspectionReport: ['none','rejected'].includes(verificationStatus) ? undefined : car.inspectionReport,
      } : car))
    } catch (updateError) {
      console.error('Admin verification update error:', updateError)
      setError('Could not update verification. Please try again.')
    } finally {
      setUpdatingCarId('')
    }
  }

  const setInspectionDraftSection = (car: Car, index: number, patch: Partial<InspectionDraftSection>) => {
    setInspectionDrafts(current => {
      const draft = current[car.id] ?? buildInspectionDraft(car)
      return {
        ...current,
        [car.id]: draft.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section),
      }
    })
  }

  const startInspection = async (car: Car) => {
    setInspectionDrafts(current => current[car.id] ? current : { ...current, [car.id]: buildInspectionDraft(car) })
    setActiveInspectionCarId(car.id)
    if (car.verificationStatus !== 'inspecting') {
      await setCarVerification(car.id, 'inspecting')
    }
  }

  const saveInspectionDraft = async (car: Car) => {
    const draft = inspectionDrafts[car.id] ?? buildInspectionDraft(car)
    const sections = draftToReportSections(draft)
    const hasScore = sections.some(section => section.score !== null)
    const overallScore = hasScore ? draftOverallScore(draft) : null
    const report = {
      status: 'in_progress' as const,
      version: 'yourcar-300-point-v1',
      totalPoints: INSPECTION_SECTIONS.reduce((sum, section) => sum + section.points, 0),
      overallScore,
      sections,
      inspectedBy: currentUser?.email || currentUser?.phoneNumber || 'admin',
    }
    setUpdatingCarId(car.id)
    setError('')
    try {
      if (isAdminIdentity(currentUser)) {
        await updateDoc(doc(db, 'cars', car.id), {
          verificationStatus: 'inspecting',
          isTrusted: false,
          overallScore,
          inspectionReport: { ...report, updatedAt: serverTimestamp() },
          updatedAt: serverTimestamp(),
        })
      } else {
        const response = await fetch(`/api/admin/cars/${car.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationStatus: 'inspecting', overallScore, inspectionReport: report }),
        })
        const result = await response.json().catch(() => ({}))
        if (response.status === 401) {
          expireAdminSession()
          return
        }
        if (!response.ok) {
          setError(`${result.error || 'Could not save inspection draft.'} Sign in with the admin email or admin phone, or add Firebase Admin credentials.`)
          return
        }
      }
      setCars(current => current.map(item => item.id === car.id ? {
        ...item,
        verificationStatus: 'inspecting',
        isTrusted: false,
        overallScore: overallScore ?? undefined,
        inspectionReport: { ...report, updatedAt: new Date().toISOString() },
      } : item))
    } catch (saveError) {
      console.error('Admin inspection draft error:', saveError)
      setError('Could not save inspection draft. Please try again.')
    } finally {
      setUpdatingCarId('')
    }
  }

  const completeInspection = async (car: Car) => {
    const draft = inspectionDrafts[car.id] ?? buildInspectionDraft(car)
    if (!draftComplete(draft)) {
      setError('Enter a score from 1 to 10 for every inspection section before completing.')
      return
    }
    const sections = draftToReportSections(draft)
    const overallScore = draftOverallScore(draft)
    const report = {
      status: 'completed' as const,
      version: 'yourcar-300-point-v1',
      totalPoints: INSPECTION_SECTIONS.reduce((sum, section) => sum + section.points, 0),
      overallScore,
      sections,
      inspectedBy: currentUser?.email || currentUser?.phoneNumber || 'admin',
    }
    setUpdatingCarId(car.id)
    setError('')
    try {
      if (isAdminIdentity(currentUser)) {
        await updateDoc(doc(db, 'cars', car.id), {
          verificationStatus: 'verified',
          isTrusted: true,
          overallScore,
          inspectionReport: { ...report, completedAt: serverTimestamp(), updatedAt: serverTimestamp() },
          verifiedAt: serverTimestamp(),
          verifiedBy: 'admin',
          updatedAt: serverTimestamp(),
        })
      } else {
        const response = await fetch(`/api/admin/cars/${car.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationStatus: 'verified', overallScore, inspectionReport: report }),
        })
        const result = await response.json().catch(() => ({}))
        if (response.status === 401) {
          expireAdminSession()
          return
        }
        if (!response.ok) {
          setError(`${result.error || 'Could not complete inspection.'} Sign in with the admin email or admin phone, or add Firebase Admin credentials.`)
          return
        }
      }
      const completedAt = new Date().toISOString()
      setCars(current => current.map(item => item.id === car.id ? {
        ...item,
        verificationStatus: 'verified',
        isTrusted: true,
        overallScore,
        inspectionReport: { ...report, completedAt, updatedAt: completedAt },
      } : item))
      setActiveInspectionCarId('')
    } catch (completeError) {
      console.error('Admin inspection complete error:', completeError)
      setError('Could not complete inspection. Please try again.')
    } finally {
      setUpdatingCarId('')
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null)
    clearAdminSession()
    if (isAdminIdentity(currentUser)) {
      await signOutUser().catch(() => null)
    }
    setCurrentUser(null)
    setCars([])
    setBids([])
    setProfiles({})
    setError('')
    setLoading(false)
    setAdminSessionVersion(version => version + 1)
  }

  if (!authChecked || (loading && canOpenAdmin)) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full"/></div>

  if (!canOpenAdmin) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
        <div className="card w-full p-8">
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-gold">Admin only</p>
            <h1 className="text-2xl font-black text-gray-900">Vehiqal admin sign in</h1>
            <p className="mt-2 text-sm text-gray-500">Admin dashboard is separate from customer login.</p>
          </div>
          <form onSubmit={adminLogin} className="space-y-4">
            <div>
              <label className="label">Admin username</label>
              <input
                value={adminUser}
                onChange={event => setAdminUser(event.target.value)}
                placeholder="admin"
                className="input"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Admin password</label>
              <input
                type="password"
                value={adminPass}
                onChange={event => setAdminPass(event.target.value)}
                placeholder="Password"
                className="input"
                autoComplete="current-password"
              />
            </div>
            {loginError && <p className="text-sm font-semibold text-red-600">{loginError}</p>}
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={event => setKeepLoggedIn(event.target.checked)}
                className="accent-navy"
              />
              Keep me logged in on this device
            </label>
            <button type="submit" disabled={loginLoading} className="btn-navy w-full justify-center disabled:opacity-60">
              {loginLoading ? 'Opening...' : 'Open admin dashboard'}
            </button>
          </form>
          <Link href="/login" className="mt-5 block text-center text-sm font-bold text-navy hover:underline">
            Customer login
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { k:'cars', l:'All cars', n:cars.length },
    { k:'verified', l:'Verified requests', n:verificationRequests.length },
    { k:'pending', l:'Pending bids', n:pending.length },
    { k:'accepted', l:'Accepted bids', n:accepted.length },
    { k:'rejected', l:'Rejected bids', n:rejected.length },
    { k:'sold', l:'Sold cars', n:soldCars.length },
  ] as const

  const visibleBids = tab === 'pending' ? pending : tab === 'accepted' ? accepted : tab === 'rejected' ? rejected : []
  const visibleCars = tab === 'sold' ? soldCars : tab === 'verified' ? verificationRequests : cars

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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

      {tab === 'cars' || tab === 'sold' || tab === 'verified' ? (
        <div className="space-y-4">
          {visibleCars.length === 0 ? <Empty text={tab === 'sold' ? 'No sold cars yet' : tab === 'verified' ? 'No verified requests yet' : 'No cars listed yet'} /> : visibleCars.map(car => {
            const seller = profiles[car.sellerId]
            const sellerName = firstText(seller?.name, car.sellerName, car.sellerId)
            const sellerPhone = firstText(seller?.phone, car.sellerPhone)
            const inspectionDraft = inspectionDrafts[car.id] ?? buildInspectionDraft(car)
            const inspectionOpen = activeInspectionCarId === car.id
            const canInspect = ['requested','inspecting'].includes(String(car.verificationStatus)) && !car.isTrusted
            return (
              <div key={car.id} className="card p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="w-20 h-16 rounded-xl bg-navylight flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {car.images?.[0] ? <img src={car.images[0]} alt={carImageAlt(car)} loading="lazy" className="h-full w-full object-cover"/> : '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900">{car.make} {car.model} {car.year}</p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CAR_ST[car.status || 'active'] ?? CAR_ST.active}`}>{statusLabel(car.status)}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${VERIFICATION_ST[car.isTrusted ? 'verified' : car.verificationStatus || 'none'] ?? VERIFICATION_ST.none}`}>{verificationLabel(car)}</span>
                      {car.overallScore && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-greenlight text-green border border-green/30">Health {car.overallScore}/10</span>}
                    </div>
                    <p className="text-navy font-black">{formatPrice(car.price)}</p>
                    <p className="text-gray-400 text-xs">
                      {car.city}{car.registeredLocation ? ` · Registered: ${car.registeredLocation}` : ''} · Seller: {sellerName}
                    </p>
                    <p className="text-gray-600 text-sm font-semibold">
                      Seller phone:{' '}
                      {sellerPhone ? <a href={`tel:${sellerPhone}`} className="text-navy hover:underline">{sellerPhone}</a> : <span className="text-gray-400">Not saved</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/sell?edit=${car.id}`} className="rounded-xl border border-navy/20 px-4 py-2 text-sm font-bold text-navy hover:bg-navylight">
                      Edit
                    </Link>
                    {sellerPhone && <a href={`tel:${sellerPhone}`} className="btn-outline text-sm !px-4 !py-2">Call seller</a>}
                    {canInspect && (
                      <>
                        <button
                          type="button"
                          disabled={updatingCarId === car.id}
                          onClick={() => startInspection(car)}
                          className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navydark disabled:opacity-50"
                        >
                          {car.verificationStatus === 'inspecting' ? 'Continue inspection' : 'Start inspection'}
                        </button>
                        <button
                          type="button"
                          disabled={updatingCarId === car.id}
                          onClick={() => setCarVerification(car.id, 'rejected')}
                          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject inspection
                        </button>
                      </>
                    )}
                    {car.isTrusted && (
                      <button
                        type="button"
                        disabled={updatingCarId === car.id}
                        onClick={() => setCarVerification(car.id, 'none')}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Remove inspected
                      </button>
                    )}
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
                    <button
                      type="button"
                      onClick={() => window.location.assign(`/cars/${car.id}`)}
                      className="text-navy font-bold text-sm hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
                {inspectionOpen && (
                  <InspectionPanel
                    draft={inspectionDraft}
                    overallScore={draftOverallScore(inspectionDraft)}
                    saving={updatingCarId === car.id}
                    onChange={(index, patch) => setInspectionDraftSection(car, index, patch)}
                    onSave={() => saveInspectionDraft(car)}
                    onComplete={() => completeInspection(car)}
                    onClose={() => setActiveInspectionCarId('')}
                  />
                )}
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

function InspectionPanel({ draft, overallScore, saving, onChange, onSave, onComplete, onClose }: {
  draft: InspectionDraftSection[]
  overallScore: number
  saving: boolean
  onChange: (index: number, patch: Partial<InspectionDraftSection>) => void
  onSave: () => void
  onComplete: () => void
  onClose: () => void
}) {
  const complete = draftComplete(draft)
  const totalPoints = INSPECTION_SECTIONS.reduce((sum, section) => sum + section.points, 0)

  return (
    <div className="mt-5 rounded-2xl border border-navy/10 bg-navylight p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-navy">300-point inspection</p>
          <h3 className="text-lg font-black text-gray-900">Rate all 10 vehicle health sections</h3>
          <p className="text-sm text-gray-500">Scores are weighted by checklist size, so Engine & Drivetrain carries more weight than Road Test.</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400">Overall health</p>
          <p className="text-3xl font-black text-navy">{overallScore}</p>
          <p className="text-xs text-gray-400">/ 10</p>
        </div>
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-green transition-all" style={{ width: `${Math.min(100, Math.max(0, overallScore * 10))}%` }} />
      </div>

      <div className="grid gap-3">
        {draft.map((section, index) => {
          const score = section.score === '' ? null : Number(section.score)
          const weighted = score === null ? 0 : Math.round(((score * section.points) / totalPoints) * 100) / 100
          return (
            <div key={section.id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_120px_1fr] lg:items-start">
                <div>
                  <p className="text-sm font-black text-gray-900">{index + 1}. {section.title}</p>
                  <p className="text-xs text-gray-400">{section.points} checklist points · weighted {weighted}/10</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-400">Score</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={section.score}
                    onChange={event => {
                      const value = event.target.value
                      if (value === '') {
                        onChange(index, { score: '' })
                        return
                      }
                      const next = Math.max(1, Math.min(10, Number(value)))
                      onChange(index, { score: Number.isFinite(next) ? String(next) : '' })
                    }}
                    className="input !py-2 text-center font-black"
                    placeholder="1-10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-gray-400">Notes</label>
                  <input
                    value={section.notes}
                    onChange={event => onChange(index, { notes: event.target.value })}
                    className="input !py-2"
                    placeholder="Issue, repair note, or clean"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button type="button" onClick={onClose} className="btn-outline justify-center text-sm !px-4 !py-2">Close</button>
        <button type="button" onClick={onSave} disabled={saving} className="btn-outline justify-center text-sm !px-4 !py-2 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving || !complete}
          className="rounded-xl bg-green px-4 py-2 text-sm font-bold text-white hover:bg-[#158759] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? 'Saving...' : 'Complete inspection & approve'}
        </button>
      </div>
      {!complete && <p className="mt-2 text-right text-xs font-semibold text-gray-400">All 10 scores are required before approval.</p>}
    </div>
  )
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
