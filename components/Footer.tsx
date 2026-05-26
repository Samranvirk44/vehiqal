import Link from 'next/link'
import { VehiqalIcon, VehiqalWordmark } from '@/components/VehiqalLogo'
import { FACEBOOK_URL } from '@/lib/seo'

export function Footer() {
  const punjabCities = ['Gujranwala','Lahore','Sialkot','Gujrat','Sheikhupura']
  const otherCities  = ['Karachi','Islamabad','Rawalpindi']

  return (
    <footer className="bg-navy text-blue-200">
      {/* Slogan banner */}
      <div className="bg-gold px-4 py-3 text-center md:py-4">
        <p className="text-base font-black tracking-wide text-yellow-900 md:text-lg">
          We take your Headache — Payment &amp; Car Guarantee
        </p>
        <p className="mt-1 text-xs text-yellow-800 md:text-sm">
          A fair, transparent, win-win deal for every buyer and seller.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-7 px-4 py-8 md:grid-cols-4 md:gap-10 md:py-14">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <VehiqalIcon size={34}/>
            <VehiqalWordmark size="text-xl"/>
          </div>
          <p className="text-sm text-blue-300 leading-relaxed mb-2">
            Pakistan&apos;s most trusted car marketplace. Verified deals, safe payments.
          </p>
          <p className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-5">
            Verified deals · Trusted platform
          </p>
          {/* Contact card */}
          <div className="mb-4 grid gap-3 rounded-lg border border-white/10 bg-white/5 p-3 md:mb-5 md:block md:p-4">
            <div>
              <p className="text-sm font-bold text-white">Contact us</p>
              <p className="text-xs text-blue-300">Vehiqal support team</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:block">
              <a href="tel:+923034642619" className="rounded-md bg-gold px-3 py-2 text-center text-sm font-black text-navy transition-colors hover:bg-yellow-300 md:mt-2 md:flex md:bg-transparent md:p-0 md:text-left md:text-lg md:text-gold md:hover:bg-transparent md:hover:text-yellow-300">
                Call
              </a>
              <a href="https://wa.me/923034642619" target="_blank" rel="noopener noreferrer"
                className="rounded-md bg-green px-3 py-2 text-center text-sm font-black text-white hover:bg-[#15885B] md:mt-1 md:flex md:bg-transparent md:p-0 md:text-left md:text-xs md:font-semibold md:text-green md:hover:bg-transparent md:hover:text-green">
                WhatsApp
              </a>
            </div>
            <a href="mailto:info@vehiqal.com" className="text-xs font-semibold text-blue-200 hover:text-gold">
              info@vehiqal.com
            </a>
          </div>
          <div className="flex gap-3">
            <a href="https://wa.me/923034642619" target="_blank" rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-green text-sm font-bold text-white transition-colors hover:bg-[#15885B]">W</a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-500">f</a>
          </div>
        </div>

        {/* Browse */}
        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white md:text-base md:normal-case md:tracking-normal">Browse Cars</h4>
          <ul className="grid gap-2 text-sm md:block md:space-y-2.5">
            {[...punjabCities, ...otherCities].map(city => (
              <li key={city}>
                <Link href={`/cars-for-sale-${city.toLowerCase()}`} className="hover:text-gold transition-colors">
                  <span className="sm:hidden">{city}</span>
                  <span className="hidden sm:inline">Cars in {city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sell */}
        <div>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white md:text-base md:normal-case md:tracking-normal">Sell Your Car</h4>
          <ul className="grid gap-2 text-sm md:block md:space-y-2.5">
            {punjabCities.map(city => (
              <li key={city}>
                <Link href={`/sell-car-${city.toLowerCase()}`} className="hover:text-gold transition-colors">
                  <span className="sm:hidden">{city}</span>
                  <span className="hidden sm:inline">Sell in {city}</span>
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <Link href="/sell" className="inline-flex rounded-md bg-gold px-3 py-2 text-xs font-black text-navy transition-colors hover:bg-yellow-300 md:bg-transparent md:p-0 md:text-sm md:text-white md:hover:bg-transparent md:hover:text-gold">List free</Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="col-span-2 md:col-span-1">
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white md:text-base md:normal-case md:tracking-normal">Vehiqal</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:block md:space-y-2.5">
            <li><Link href="/about" className="hover:text-gold transition-colors">About Vehiqal</Link></li>
            <li><Link href="/contact" className="hover:text-gold transition-colors">Contact us</Link></li>
            <li><Link href="/reviews" className="hover:text-gold transition-colors">Reviews</Link></li>
            <li><Link href="/cars?trusted=true" className="hover:text-gold transition-colors">Inspected Cars</Link></li>
            <li><Link href="/sell" className="hover:text-gold transition-colors">List your car</Link></li>
            <li><Link href="/login" className="hover:text-gold transition-colors">Sign in</Link></li>
            <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-gold transition-colors">Terms</Link></li>
            <li><a href="tel:+923034642619" className="hover:text-gold transition-colors">Call us</a></li>
            <li><a href="mailto:info@vehiqal.com" className="hover:text-gold transition-colors">info@vehiqal.com</a></li>
          </ul>
          <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 md:mt-6 md:block md:p-4">
            <p className="text-sm font-bold text-white md:mb-1">Call directly</p>
            <a href="tel:+923034642619" className="rounded-md bg-gold px-3 py-2 text-sm font-black text-navy transition-colors hover:bg-yellow-300 md:bg-transparent md:p-0 md:text-xl md:text-gold md:hover:bg-transparent md:hover:text-yellow-300">0303 4642619</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-blue-400 md:py-6">
        <p>© {new Date().getFullYear()} Vehiqal. All rights reserved. · vehiqal.com · vehiqal.pk</p>
        <p className="mt-1">
          <Link href="/privacy" className="hover:text-gold">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-gold">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-gold">Contact</Link>
        </p>
        <p className="mt-1">Gujranwala · Lahore · Sialkot · Gujrat · Sheikhupura · Karachi · Islamabad</p>
      </div>
    </footer>
  )
}
