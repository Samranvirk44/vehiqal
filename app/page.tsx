import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroSearch, LatestCars } from '@/components/LandingClient'
import { VehiqalIcon, VehiqalWordmark } from '@/components/VehiqalLogo'

export const metadata: Metadata = {
  title: 'Vehiqal — We take your Headache. Payment & Car Guarantee.',
  description: 'Buy and sell inspected used cars in Pakistan. We take full responsibility for inspected car deals. 300-point inspection. Win-win for buyer and seller. Call 0303 4642619.',
}
export const revalidate = 300

export default function HomePage() {

  const punjabCities = [
    { name:'Gujranwala', slug:'gujranwala' },
    { name:'Lahore',     slug:'lahore' },
    { name:'Sialkot',    slug:'sialkot' },
    { name:'Gujrat',     slug:'gujrat' },
    { name:'Sheikhupura',slug:'sheikhupura' },
  ]

  return (
    <>
      {/* ══════════════════════════════════════════
          HERO — full screen with animated logo
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-8 md:py-12">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4A9E] via-navy to-[#060E1E]" />
        {/* Grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] bg-gold -translate-y-1/3 translate-x-1/3 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.05] bg-green -translate-y-1/2 -translate-x-1/3 pointer-events-none"/>

        <div className="relative z-10 text-center w-full max-w-6xl mx-auto">

          {/* Compact brand signal */}
          <div className="mb-5 flex items-center justify-center gap-3">
            <VehiqalIcon size={54} animate={true} />
            <div className="text-left">
              <VehiqalWordmark size="text-3xl md:text-4xl" />
              <p className="text-blue-300/70 text-[10px] tracking-[3px] uppercase font-bold mt-1">
                Verified deals · Trusted platform
              </p>
            </div>
          </div>

          {/* Slogan — main marketing message */}
          <div className="mx-auto mb-5 inline-flex flex-col items-center rounded-2xl border border-gold/25 bg-gold/10 px-5 py-3 fade-up sm:flex-row sm:gap-3">
            <p className="text-gold font-black text-base md:text-lg">
              We take your Headache
            </p>
            <p className="text-blue-200 font-semibold text-sm md:text-base">
              Payment &amp; Car Guarantee
            </p>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 fade-up-2">
            Pakistan&apos;s most trusted<br />
            <span className="text-gold">car marketplace</span>
          </h1>

          <p className="text-blue-200/75 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6 fade-up-3">
            Every car physically inspected. Every deal fully managed by us.
            No stress, no scams, no strangers exchanging cash.
          </p>

          {/* Search form */}
          <div className="mb-5 fade-up-3">
            <HeroSearch />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            <Link href="/cars" className="btn-gold !px-6 !py-3 !text-sm">
              Browse verified cars →
            </Link>
            <Link href="/sell"
              className="border border-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/8 transition-colors text-sm">
              Sell your car free
            </Link>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { dot:'bg-green',  label:'300-point inspection' },
              { dot:'bg-gold',   label:'We handle everything' },
              { dot:'bg-blue-400', label:'Win-win for all parties' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-blue-200/85 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${p.dot} animate-pulse`}/>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/20 text-xs tracking-widest uppercase md:flex">
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"/>
          scroll
        </div>
      </section>

      {/* ══ STATS — cities covered, not cars ══ */}
      <section className="bg-navydark text-white grid grid-cols-2 md:grid-cols-4">
        {[
          { n:'5', l:'Cities covered' },
          { n:'300', l:'Inspection points' },
          { n:'1,100+', l:'Deals completed' },
          { n:'100%', l:'Payment guarantee' },
        ].map((st,i) => (
          <div key={st.l} className={`py-8 px-6 text-center ${i < 3 ? 'border-r border-white/8' : ''}`}>
            <div className="text-3xl font-black text-gold">{st.n}</div>
            <div className="text-xs text-blue-300/60 mt-1 font-semibold uppercase tracking-wider">{st.l}</div>
          </div>
        ))}
      </section>

      {/* ══ RESPONSIBILITY — "We take your headache" ══ */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-goldlight border border-gold/40 text-yellow-800 text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-wider">
                🤝 Our Responsibility
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-navy leading-tight mb-5">
                We take your<br/>
                <span className="text-gold">headache away</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-4">
                Buying or selling a car in Pakistan has always been stressful. Hidden faults, payment risks, strangers at your door.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed font-medium mb-8">
                We built Vehiqal to take all of that off your plate on inspected cars. From the first inspection to the final payment, <strong>we are responsible for inspected car deals.</strong>
              </p>
              <div className="bg-gold/10 border-l-4 border-gold rounded-r-xl px-5 py-4">
                <p className="text-navy font-black text-xl">Payment &amp; Car Guarantee</p>
                <p className="text-gray-600 text-sm mt-1">A fair, transparent, win-win deal for every buyer and seller on our platform.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { icon:'💰', title:'We own the payment', color:'border-navy', bg:'bg-navylight',
                  desc:'For inspected cars, money flows through Vehiqal. We are fully responsible for the inspected-car transaction. Buyers pay safely, sellers receive securely — no direct cash exchange ever.' },
                { icon:'🚗', title:'We own the car deal', color:'border-gold', bg:'bg-goldlight',
                  desc:'We manage inspection, verification, bidding, and handover. You focus on getting the best price — we handle the entire process from start to finish.' },
                { icon:'🤝', title:'Win-win for everyone', color:'border-green', bg:'bg-greenlight',
                  desc:'Sellers get verified buyers at fair market prices. Buyers get inspected cars with zero surprises. We make sure both sides walk away satisfied.' },
              ].map(card => (
                <div key={card.title} className={`${card.bg} border-l-4 ${card.color} rounded-xl p-5`}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <h3 className="font-black text-navy text-base mb-1">{card.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ INSPECTION ══ */}
      <section className="bg-gradient-to-br from-goldlight to-[#FFF9EE] py-20 px-4 border-y border-gold/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="trusted-badge text-sm px-4 py-2 mb-5">✓ Inspected by Vehiqal</div>
            <h2 className="text-4xl md:text-5xl font-black text-navy mb-4">
              We inspect every car.<br />
              <span className="text-gold">So you don&apos;t have to.</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Every verified car is physically inspected across 10 sections before listing. You see the full report and score before placing any bid.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {[
              { n:'01', name:'Engine & Drivetrain',   pts:'42 pts' },
              { n:'02', name:'Transmission & Clutch', pts:'28 pts' },
              { n:'03', name:'Suspension & Steering', pts:'35 pts' },
              { n:'04', name:'Body, Paint & Frame',   pts:'38 pts' },
              { n:'05', name:'Interior & Comfort',    pts:'40 pts' },
              { n:'06', name:'Electricals & AC',      pts:'36 pts' },
              { n:'07', name:'Tyres & Brakes',        pts:'28 pts' },
              { n:'08', name:'Safety & ADAS',         pts:'22 pts' },
              { n:'09', name:'Documents & History',   pts:'16 pts' },
              { n:'10', name:'Road Test',             pts:'15 pts' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-xl p-4 border border-gold/20 relative shadow-sm">
                <div className="absolute top-3 right-3 w-5 h-5 bg-green rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div className="text-xs font-black text-gold mb-1 tracking-wider">{s.n}</div>
                <div className="font-bold text-gray-800 text-xs leading-tight">{s.name}</div>
                <div className="text-xs text-gray-400 mt-1">{s.pts}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/cars?trusted=true" className="btn-navy !px-10 !py-4 !text-base">
              Browse all verified cars →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ LATEST LISTINGS ══ */}
      <section className="section">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Latest listings</h2>
            <p className="text-gray-400 text-sm mt-1">Fresh cars added daily across Pakistan</p>
          </div>
          <Link href="/cars" className="text-navy font-bold text-sm hover:text-gold transition-colors">View all →</Link>
        </div>
        <LatestCars />
      </section>

      {/* ══ CITY LINKS ══ */}
      <section className="bg-navylight py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-navy mb-2">Find cars near you</h2>
            <p className="text-gray-500 text-sm">Currently serving Punjab — expanding soon</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {punjabCities.map(city => (
              <Link key={city.name} href={`/cars-for-sale-${city.slug}`}
                className="bg-white rounded-xl p-5 text-center hover:shadow-md hover:border-navy border border-transparent transition-all group">
                <div className="text-2xl mb-2">🏙️</div>
                <div className="font-bold text-gray-800 group-hover:text-navy text-sm">{city.name}</div>
              </Link>
            ))}
          </div>
          <p className="text-center text-gray-400 text-xs">Also available in Karachi, Islamabad, Rawalpindi and more cities</p>
        </div>
      </section>

      {/* ══ CONTACT / FINAL CTA ══ */}
      <section className="bg-navydark py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to buy or sell?
            </h2>
            <p className="text-blue-300/70 text-lg leading-relaxed mb-6">
              Browse verified cars or list yours for free. Every deal is managed by us — safely and transparently.
            </p>
            <div className="flex gap-3 flex-wrap mb-8">
              <Link href="/cars" className="btn-gold">Browse cars</Link>
              <Link href="/sell" className="btn-white">List your car free</Link>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gold font-black text-lg">We take your headache.</p>
              <p className="text-blue-300/60 text-sm mt-1">Payment &amp; Car Guarantee on every deal.</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1A4A9E] to-navy border border-gold/30 rounded-2xl p-8 text-center">
            <p className="text-blue-300/50 text-xs uppercase tracking-widest font-bold mb-3">Speak to Vehiqal</p>
            <p className="text-white font-black text-lg mb-5">Our support team is ready to help</p>
            <a href="tel:+923034642619"
              className="block bg-gold text-yellow-900 font-black text-2xl px-6 py-5 rounded-xl hover:bg-golddark transition-colors mb-3 tracking-wide">
              0303 4642619
            </a>
            <a href="https://wa.me/923034642619" target="_blank" rel="noopener noreferrer"
              className="block bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm mb-4">
              💬 WhatsApp us
            </a>
            <a href="mailto:info@vehiqal.com" className="block text-blue-200 hover:text-gold font-bold text-sm mb-4 transition-colors">
              info@vehiqal.com
            </a>
            <p className="text-blue-400/40 text-xs">Mon–Sat · 9am–7pm PKT</p>
          </div>
        </div>
      </section>
    </>
  )
}
