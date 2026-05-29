'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { onAuthChange, signOut, getUserProfile } from '@/lib/auth'
import { clearAdminSession, hasAdminSession, isAdminIdentity, setAdminSession } from '@/lib/admin'
import { VehiqalIcon, VehiqalWordmark } from '@/components/VehiqalLogo'
import type { User } from 'firebase/auth'

export function Navbar() {
  const [user, setUser]         = useState<User | null>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [admin, setAdmin]       = useState(false)
  const [open, setOpen]         = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setAdmin(hasAdminSession())
    return onAuthChange(async (u) => {
      setUser(u)
      const adminByAuth = isAdminIdentity(u)
      if (adminByAuth) setAdminSession()
      setAdmin(hasAdminSession() || adminByAuth)
      if (u) { const p = await getUserProfile(u.uid); setProfile(p) } else setProfile(null)
    })
  }, [])

  useEffect(() => {
    setAdmin(hasAdminSession() || isAdminIdentity(user))
  }, [pathname, user?.email, user?.phoneNumber])

  const active = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))
      ? 'text-gold' : 'text-blue-200 hover:text-white'

  const initials = profile?.name?.charAt(0)?.toUpperCase() || '?'

  const logoutAdmin = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null)
    clearAdminSession()
    if (isAdminIdentity(user)) {
      await signOut().catch(() => null)
    }
    setAdmin(false)
    setUser(null)
    setProfile(null)
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-navydark/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between md:h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="transition-transform group-hover:scale-105">
              <VehiqalIcon size={32} />
            </div>
            <VehiqalWordmark size="text-lg md:text-xl" />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/cars"      className={`text-sm font-semibold transition-colors ${active('/cars')}`}>Browse Cars</Link>
            <Link href="/sell"      className={`text-sm font-semibold transition-colors ${active('/sell')}`}>Sell Your Car</Link>
            {/* Phone — prominent in nav */}
            <a href="tel:+923034642619"
              className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-lg px-3 py-1.5 text-gold text-sm font-bold hover:bg-white/15 transition-colors">
              📞 0303 4642619
            </a>
            {admin ? (
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <Link href="/admin" className={`text-sm font-semibold transition-colors ${active('/admin')}`}>Admin</Link>
                <button onClick={logoutAdmin} className="text-xs text-blue-300 hover:text-white transition-colors">Sign out</button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <Link href="/dashboard" className={`text-sm font-semibold transition-colors ${active('/dashboard')}`}>Dashboard</Link>
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                  <span className="text-yellow-900 font-bold text-sm">{initials}</span>
                </div>
                <button onClick={() => signOut()} className="text-xs text-blue-300 hover:text-white transition-colors">Sign out</button>
              </div>
            ) : (
              <Link href="/login" className="btn-gold text-sm !px-4 !py-2">Sign in</Link>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="lg:hidden rounded-lg border border-white/10 bg-white/5 p-2 text-white"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <div className={`w-5 h-0.5 bg-white mb-1.5 transition-all ${open ? 'rotate-45 translate-y-2' : ''}`}/>
            <div className={`w-5 h-0.5 bg-white mb-1.5 transition-all ${open ? 'opacity-0' : ''}`}/>
            <div className={`w-5 h-0.5 bg-white transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`}/>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-navydark px-4 py-4 shadow-2xl">
          <div className="grid gap-2">
            <Link href="/cars" onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-4 py-3 text-sm font-black text-blue-100">Browse Cars</Link>
            <Link href="/sell" onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-4 py-3 text-sm font-black text-blue-100">Sell Your Car</Link>
            <a href="tel:+923034642619" className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-black text-gold">Call 0303 4642619</a>
          </div>
          {admin
            ? <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/admin" onClick={() => setOpen(false)} className="btn-white">Admin</Link>
                <button onClick={() => { setOpen(false); logoutAdmin() }} className="rounded-lg border border-red-400/30 px-4 py-2.5 text-sm font-black text-red-300">Sign out</button></div>
            : user
            ? <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/dashboard" onClick={() => setOpen(false)} className="btn-white">Dashboard</Link>
                <button onClick={() => { signOut(); setOpen(false) }} className="rounded-lg border border-red-400/30 px-4 py-2.5 text-sm font-black text-red-300">Sign out</button></div>
            : <Link href="/login" onClick={() => setOpen(false)} className="btn-gold mt-3 w-full">Sign in</Link>
          }
        </div>
      )}
    </nav>
  )
}
