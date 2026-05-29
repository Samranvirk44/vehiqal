'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setupRecaptcha, sendOTP, getUserProfile, createUserProfile } from '@/lib/auth'
import { auth } from '@/lib/firebase'
import { isAdminEmail, isAdminIdentity, setAdminSession } from '@/lib/admin'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  type ConfirmationResult,
} from 'firebase/auth'

const CODES = [{code:'+92',flag:'🇵🇰'},{code:'+61',flag:'🇦🇺'},{code:'+1',flag:'🇺🇸'},{code:'+44',flag:'🇬🇧'}]
const RESEND_DELAY_MS = 60_000

function normalizePhone(country: string, value: string) {
  const countryDigits = country.replace(/\D/g, '')
  let digits = value.replace(/\D/g, '')

  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith(countryDigits)) digits = digits.slice(countryDigits.length)
  digits = digits.replace(/^0+/, '')

  return `${country}${digits}`
}

function getFirebaseAuthCode(error: any) {
  const directCode = typeof error?.code === 'string' ? error.code : ''
  if (directCode) return directCode

  const message = typeof error?.message === 'string' ? error.message : ''
  return message.match(/auth\/[a-z0-9-]+/i)?.[0]?.toLowerCase() ?? ''
}

function getOtpErrorMessage(error: any, phone: string) {
  const code = getFirebaseAuthCode(error)
  const message = typeof error?.message === 'string' ? error.message : ''
  const lowerMessage = message.toLowerCase()
  const safeMessage = message
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/i, '')
    .trim()

  if (code === 'auth/invalid-phone-number' || lowerMessage.includes('invalid-phone-number')) {
    return 'Invalid phone number. For Pakistan, enter a real mobile like 3001234567 or 03001234567.'
  }

  if (code === 'auth/missing-phone-number') {
    return 'Enter a mobile number before sending the OTP.'
  }

  if (code === 'auth/too-many-requests' || lowerMessage.includes('too-many-requests')) {
    return 'Too many OTP attempts. Please wait a while before trying again.'
  }

  if (code === 'auth/quota-exceeded' || lowerMessage.includes('quota')) {
    return 'Firebase SMS quota is exhausted. Try again later or use a configured Firebase test number.'
  }

  if (code === 'auth/billing-not-enabled') {
    return 'Firebase requires billing to send SMS for this project. Enable billing or upgrade Auth/Identity Platform.'
  }

  if (code === 'auth/network-request-failed' || lowerMessage.includes('network')) {
    return 'Network error while sending OTP. Check the internet connection and try again.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Phone sign-in is not enabled in Firebase Authentication.'
  }

  if (code === 'auth/unauthorized-domain' || code === 'auth/app-not-authorized') {
    return 'This domain is not allowed in Firebase Auth. Add this domain in Firebase Authentication authorized domains.'
  }

  if (code === 'auth/captcha-check-failed' || code === 'auth/missing-app-credential' || code === 'auth/invalid-app-credential') {
    return 'reCAPTCHA could not verify this browser. Refresh the page, use the production domain or localhost, then try again.'
  }

  if (safeMessage) return `Could not send OTP. Firebase said: ${safeMessage}`

  return phone.startsWith('+92')
    ? 'Could not send OTP to this Pakistani mobile. Check Firebase SMS quota/throttling, then try again after a few minutes.'
    : 'Could not send OTP. Use a real SMS-capable number.'
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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminRequested = searchParams.get('admin') === 'true'
  const requestedRedirect = searchParams.get('redirect')
  const redirect = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.startsWith('/login')
    ? requestedRedirect
    : adminRequested ? '/admin' : '/dashboard'
  const [mode, setMode] = useState<'phone'|'admin'>(adminRequested ? 'admin' : 'phone')
  const [userFlow, setUserFlow] = useState<'signin'|'register'>(searchParams.get('register') === 'true' || redirect === '/sell' ? 'register' : 'signin')
  const [step, setStep]   = useState<'phone'|'otp'>('phone')
  const [country, setCountry] = useState('+92')
  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState('')
  const [name, setName]     = useState('')
  const [sentPhone, setSentPhone] = useState('')
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [otpStatus, setOtpStatus] = useState('')
  const [conf, setConf]     = useState<ConfirmationResult|null>(null)
  const rRef = useRef<any>(null)
  const full = normalizePhone(country, phone)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hostname === '127.0.0.1') {
      const url = new URL(window.location.href)
      url.hostname = 'localhost'
      window.location.replace(url.toString())
    }
  }, [])

  useEffect(() => {
    if (adminRequested) router.replace('/admin')
  }, [adminRequested, router])

  useEffect(() => {
    if (adminRequested) return
    return onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && step === 'phone' && !loading) {
        router.replace(redirect || '/dashboard')
      }
    })
  }, [adminRequested, loading, redirect, router, step])

  useEffect(() => {
    if (step !== 'otp' || resendAvailableAt <= Date.now()) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [step, resendAvailableAt])

  const resetRecaptcha = () => {
    try { rRef.current?.clear?.() } catch {}
    rRef.current = null
    const container = document.getElementById('recaptcha-container')
    if (container) container.innerHTML = ''
  }

  const validatePhoneForm = () => {
    const localDigits = full.replace(country, '')
    if (!localDigits || localDigits.length < 8){setError('Enter a valid phone number.');return false}
    if (country === '+92' && !/^3\d{9}$/.test(localDigits)){setError('For Pakistan, enter a mobile like 3001234567 or 03001234567.');return false}
    if (userFlow === 'register' && !name.trim()){setError('Enter your name to register.');return false}
    return true
  }

  const requestOtp = async () => {
    setLoading(true);setError('')
    setOtpStatus('Checking reCAPTCHA before sending your code...')
    try {
      setOtp('')
      setConf(null)
      resetRecaptcha()
      await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence)
      rRef.current = setupRecaptcha('recaptcha-container')
      setOtpStatus(`Complete the reCAPTCHA if it appears. Sending code to ${full}...`)
      setConf(await sendOTP(full, rRef.current))
      setSentPhone(full)
      setResendAvailableAt(Date.now() + RESEND_DELAY_MS)
      setNow(Date.now())
      setStep('otp')
      setOtpStatus('')
    } catch(e:any){
      console.error('sendOTP error:', e)
      setError(getOtpErrorMessage(e, full))
      setOtpStatus('')
      resetRecaptcha()
    }
    finally{setLoading(false)}
  }

  const adminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const data = new FormData(e.currentTarget)
    const enteredUsername = String(data.get('adminUser') ?? '').trim()
    const username = enteredUsername || 'admin'
    const password = String(data.get('adminPass') ?? '')
    setLoading(true)
    try {
      const normalizedUsername = username.trim().toLowerCase()
      const firebaseEmail = username.includes('@')
        ? username.trim()
        : ['admin', 'vehiqaladmin'].includes(normalizedUsername) ? 'admin.vehiqal@gmail.com' : ''

      if (firebaseEmail) {
        try {
          await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence)
          const credential = await withTimeout(signInWithEmailAndPassword(auth, firebaseEmail, password), username.includes('@') ? 10000 : 3000)
          if (!isAdminEmail(credential.user.email)) {
            setError('This email is not allowed as admin.')
            return
          }
          setAdminSession()
          router.replace('/admin')
          return
        } catch (emailLoginError) {
          if (username.includes('@')) throw emailLoginError
        }
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(result.error || 'Invalid admin username or password.')
        return
      }
      setAdminSession()
      router.replace('/admin')
    } catch (loginError: any) {
      if (loginError?.code === 'auth/invalid-credential' || loginError?.code === 'auth/user-not-found' || loginError?.code === 'auth/wrong-password') {
        setError('Invalid admin email or password.')
      } else if (loginError?.code === 'auth/operation-not-allowed') {
        setError('Email/password login is not enabled in Firebase Auth.')
      } else {
        setError('Could not open admin dashboard. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePhoneForm()) return
    await requestOtp()
  }

  const resendCode = async () => {
    if (Date.now() < resendAvailableAt) return
    if (!validatePhoneForm()) {
      setStep('phone')
      return
    }
    await requestOtp()
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp||otp.length<6){setError('Enter the 6-digit code.');return}
    if (!conf) return
    setLoading(true);setError('')
    try {
      const r = await conf.confirm(otp)
      try {
        const p = await getUserProfile(r.user.uid)
        const savedPhone = r.user.phoneNumber || sentPhone || full
        const savedName = userFlow === 'register'
          ? name.trim()
          : p?.name ?? r.user.displayName ?? ''
        const profileUpdate: any = {
          phone:savedPhone,
          role:p?.role ?? 'buy',
          isBuyer:p?.isBuyer ?? true,
          isSeller:p?.isSeller ?? false,
          savedCars:p?.savedCars ?? [],
        }
        if (savedName) profileUpdate.name = savedName
        await createUserProfile(r.user.uid, profileUpdate)
      } catch (profileError) {
        console.error('profile save after login failed:', profileError)
      }
      if (adminRequested && isAdminIdentity(r.user)) setAdminSession()
      await r.user.getIdToken(true).catch(() => null)
      window.location.assign(redirect || '/dashboard')
    } catch(error:any){
      console.error('verifyOtp error:', error)
      setError(error?.code?.startsWith('auth/') ? 'Incorrect code. Try again.' : 'Signed in, but could not save your phone number. Please try again.')
    }
    finally{setLoading(false)}
  }

  return (
    <div className="card p-8">
      <div id="recaptcha-container"/>
      {adminRequested ? (
        <div className="mb-5 rounded-xl bg-navylight px-4 py-3 text-sm font-bold text-navy">
          Opening admin sign in...
        </div>
      ) : null}

      {mode==='admin'&&(
        <form onSubmit={adminLogin} className="space-y-4">
          <div>
            <label className="label">Admin email or username</label>
            <input name="adminUser" value={adminUser} onChange={e=>setAdminUser(e.target.value)} placeholder="admin" className="input" autoComplete="username"/>
          </div>
          <div>
            <label className="label">Admin password</label>
            <input name="adminPass" type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} placeholder="Password" className="input" autoComplete="current-password"/>
          </div>
          {error&&<p className="text-red-500 text-sm">{error}</p>}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={e=>setKeepLoggedIn(e.target.checked)}
              className="accent-navy"
            />
            Keep me logged in on this device
          </label>
          <button type="submit" disabled={loading} className="btn-navy w-full justify-center disabled:opacity-60">{loading?'Opening…':'Open admin dashboard'}</button>
          <button
            type="button"
            onClick={()=>{setMode('phone');setError('')}}
            className="w-full text-center text-sm font-bold text-navy hover:underline"
          >
            Use admin phone OTP
          </button>
        </form>
      )}

      {mode==='phone'&&step==='phone'&&(
        <form onSubmit={sendCode} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1">
            <button
              type="button"
              onClick={()=>{setUserFlow('signin');setStep('phone');setError('');setOtpStatus('');setOtp('');setConf(null)}}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${userFlow==='signin'?'bg-white text-navy shadow-sm':'text-gray-400 hover:text-gray-700'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={()=>{setUserFlow('register');setStep('phone');setError('');setOtpStatus('');setOtp('');setConf(null)}}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${userFlow==='register'?'bg-white text-navy shadow-sm':'text-gray-400 hover:text-gray-700'}`}
            >
              Register
            </button>
          </div>
          {userFlow==='register'&&(
            <div>
              <label className="label">Full name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Ahmed Khan" className="input" autoComplete="name" autoCapitalize="words"/>
            </div>
          )}
          <div>
            <label className="label">Phone number</label>
            <div className="flex gap-2">
              <select value={country} onChange={e=>setCountry(e.target.value)} className="input !w-auto !px-3 text-sm font-semibold">
                {CODES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="3XX XXXXXXX" className="input flex-1"/>
            </div>
          </div>
          {error&&<p className="text-red-500 text-sm">{error}</p>}
          {!error&&otpStatus&&<p className="text-gray-500 text-sm">{otpStatus}</p>}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={e=>setKeepLoggedIn(e.target.checked)}
              className="accent-navy"
            />
            Keep me logged in on this device
          </label>
          <button type="submit" disabled={loading} className="btn-navy w-full justify-center disabled:opacity-60">{loading?'Sending…':userFlow==='register'?'Send registration code':'Send verification code'}</button>
        </form>
      )}
      {mode==='phone'&&step==='otp'&&(
        <form onSubmit={verifyOtp} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-gray-500 text-sm">Code sent to <strong>{sentPhone || full}</strong></p>
            <button type="button" onClick={()=>{setStep('phone');setError('')}} className="text-navy text-xs font-semibold mt-1 hover:underline">Change number</button>
          </div>
          <div><label className="label">6-digit code</label><input type="number" value={otp} onChange={e=>setOtp(e.target.value.slice(0,6))} placeholder="_ _ _ _ _ _" maxLength={6} className="input text-center text-2xl font-bold tracking-widest"/></div>
          {error&&<p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="btn-navy w-full justify-center disabled:opacity-60">{loading?'Verifying…':userFlow==='register'?'Verify & create account':'Verify & sign in'}</button>
          <button
            type="button"
            onClick={resendCode}
            disabled={loading || now < resendAvailableAt}
            className="w-full text-center text-sm font-bold text-navy hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {now < resendAvailableAt ? `Resend code in ${Math.ceil((resendAvailableAt - now) / 1000)}s` : 'Resend code'}
          </button>
        </form>
      )}
    </div>
  )
}
