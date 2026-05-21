import Link from 'next/link'
import { VehiqalIcon, VehiqalWordmark } from '@/components/VehiqalLogo'

export function Footer() {
  const punjabCities = ['Gujranwala','Lahore','Sialkot','Gujrat','Sheikhupura']
  const otherCities  = ['Karachi','Islamabad','Rawalpindi']

  return (
    <footer className="bg-navy text-blue-200">
      {/* Slogan banner */}
      <div className="bg-gold py-4 px-4 text-center">
        <p className="text-yellow-900 font-black text-lg tracking-wide">
          We take your Headache — Payment &amp; Car Guarantee
        </p>
        <p className="text-yellow-800 text-sm mt-1">
          A fair, transparent, win-win deal for every buyer and seller.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
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
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
            <p className="text-white font-bold text-sm mb-1">Contact us</p>
            <p className="text-blue-300 text-xs">Vehiqal support team</p>
            <a href="tel:+923114642679" className="flex items-center gap-2 text-gold font-black text-lg mt-2 hover:text-yellow-300 transition-colors">
              📞 0311 4642679
            </a>
            <a href="mailto:info@vehiqal.com" className="flex items-center gap-2 text-blue-200 font-semibold text-xs mt-1 hover:text-gold">
              info@vehiqal.com
            </a>
            <a href="https://wa.me/923114642679" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-400 font-semibold text-xs mt-1 hover:text-green-300">
              💬 WhatsApp us
            </a>
          </div>
          <div className="flex gap-3">
            <a href="https://wa.me/923114642679" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-green-500 transition-colors">W</a>
            <a href="https://www.facebook.com/share/17cLGmJ3D1/?mibextid=wwXIfr" className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-blue-500 transition-colors">f</a>
          </div>
        </div>

        {/* Browse */}
        <div>
          <h4 className="text-white font-bold mb-4">Browse Cars</h4>
          <ul className="space-y-2.5 text-sm">
            {[...punjabCities, ...otherCities].map(city => (
              <li key={city}>
                <Link href={`/cars-for-sale-${city.toLowerCase()}`} className="hover:text-gold transition-colors">
                  Cars in {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sell */}
        <div>
          <h4 className="text-white font-bold mb-4">Sell Your Car</h4>
          <ul className="space-y-2.5 text-sm">
            {punjabCities.map(city => (
              <li key={city}>
                <Link href={`/sell-car-${city.toLowerCase()}`} className="hover:text-gold transition-colors">Sell in {city}</Link>
              </li>
            ))}
            <li className="pt-1">
              <Link href="/sell" className="text-white font-bold hover:text-gold transition-colors">→ List your car free</Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-bold mb-4">Vehiqal</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/cars?trusted=true" className="hover:text-gold transition-colors">✓ Inspected Cars</Link></li>
            <li><Link href="/sell" className="hover:text-gold transition-colors">List your car</Link></li>
            <li><Link href="/login" className="hover:text-gold transition-colors">Sign in</Link></li>
            <li><a href="tel:+923114642679" className="hover:text-gold transition-colors">Call us</a></li>
            <li><a href="mailto:info@vehiqal.com" className="hover:text-gold transition-colors">info@vehiqal.com</a></li>
          </ul>
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white font-bold text-sm mb-1">📞 Call directly</p>
            <a href="tel:+923114642679" className="text-gold font-black text-xl hover:text-yellow-300 transition-colors">0311 4642679</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 px-4 text-center text-xs text-blue-400">
        <p>© {new Date().getFullYear()} Vehiqal. All rights reserved. · vehiqal.com · vehiqal.pk</p>
        <p className="mt-1">Gujranwala · Lahore · Sialkot · Gujrat · Sheikhupura · Karachi · Islamabad</p>
      </div>
    </footer>
  )
}
