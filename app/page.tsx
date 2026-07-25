import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroSearch } from '@/components/LandingClient'
import { VehiqalIcon, VehiqalWordmark } from '@/components/VehiqalLogo'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  SERVICE_AREAS,
  businessJsonLd,
  jsonLdGraph,
  organizationJsonLd,
  pageMeta,
  websiteJsonLd,
} from '@/lib/seo'

const homeTitle = 'Buy and Sell Used Cars in Pakistan | Vehiqal'
const homeDescription = 'Buy and sell used cars in Pakistan. Find Honda, Toyota, Suzuki and other vehicles at the best prices on Vehiqal.'
export const metadata: Metadata = {
  ...pageMeta({
    title:homeTitle,
    description:homeDescription,
    path:'/',
    keywords:['inspected used cars Pakistan','verified car deals Pakistan','buy used cars Pakistan','sell car free Pakistan'],
  }),
  title:{ absolute:homeTitle },
  openGraph:{
    title:homeTitle,
    description:homeDescription,
    url:'https://vehiqal.com',
    siteName:'Vehiqal',
    locale:'en_PK',
    type:'website',
    images:[{ url:'https://www.vehiqal.com/opengraph-image', width:1200, height:630, alt:'Vehiqal inspected car marketplace' }],
  },
  twitter:{
    card:'summary_large_image',
    title:homeTitle,
    description:homeDescription,
    images:['https://www.vehiqal.com/opengraph-image'],
  },
}
export const revalidate = 300

const faqJsonLd = {
  '@type':'FAQPage',
  mainEntity:[
    {
      '@type':'Question',
      name:'What is Vehiqal?',
      acceptedAnswer:{ '@type':'Answer', text:'Vehiqal is a car marketplace in Pakistan focused on inspected used cars, verified listings, and safer buyer-seller deals.' },
    },
    {
      '@type':'Question',
      name:'Do you inspect cars?',
      acceptedAnswer:{ '@type':'Answer', text:'Yes. Inspected cars go through a 300-point vehicle check and show an inspected badge on the listing.' },
    },
    {
      '@type':'Question',
      name:'Which cities does Vehiqal operate in?',
      acceptedAnswer:{ '@type':'Answer', text:`Vehiqal operates in ${SERVICE_AREAS.join(', ')}.` },
    },
    {
      '@type':'Question',
      name:'How can I contact Vehiqal?',
      acceptedAnswer:{ '@type':'Answer', text:`Call Vehiqal at ${CONTACT_PHONE_DISPLAY} or email ${CONTACT_EMAIL}.` },
    },
  ],
}

const homeJsonLd = jsonLdGraph([
  organizationJsonLd(),
  businessJsonLd(),
  websiteJsonLd(),
  faqJsonLd,
])

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(homeJsonLd) }}/>
      {/* ══════════════════════════════════════════
          HERO — full screen with animated logo
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pb-8 pt-7 md:py-14">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4A9E] via-navy to-[#060E1E]" />
        {/* Grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] bg-gold -translate-y-1/3 translate-x-1/3 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.05] bg-green -translate-y-1/2 -translate-x-1/3 pointer-events-none"/>

        <div className="relative z-10 mx-auto w-full max-w-6xl text-center">

          {/* Compact brand signal */}
          <div className="mb-4 flex items-center justify-center gap-3 md:mb-5">
            <VehiqalIcon size={46} animate={true} />
            <div className="text-left">
              <VehiqalWordmark size="text-2xl md:text-4xl" />
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[2.4px] text-blue-300/70 md:mt-1 md:text-[10px] md:tracking-[3px]">
                Verified deals · Trusted platform
              </p>
            </div>
          </div>

          {/* Slogan — main marketing message */}
          <div className="fade-up mx-auto mb-4 inline-flex flex-col items-center rounded-xl border border-gold/25 bg-gold/10 px-4 py-2.5 sm:flex-row sm:gap-3 md:mb-5 md:rounded-2xl md:px-5 md:py-3">
            <p className="text-sm font-black text-gold md:text-lg">
              We take your Headache
            </p>
            <p className="text-xs font-semibold text-blue-200 md:text-base">
              Payment &amp; Car Guarantee
            </p>
          </div>

          <h1 className="fade-up-2 mb-3 text-3xl font-black leading-tight text-white md:mb-4 md:text-5xl">
            Pakistan&apos;s most trusted<br />
            <span className="text-gold">car marketplace</span>
          </h1>

          <p className="fade-up-3 mx-auto mb-5 max-w-xl text-sm leading-relaxed text-blue-200/75 md:mb-6 md:max-w-2xl md:text-lg">
            Every car physically inspected. Every deal fully managed by us.
            No stress, no scams, no strangers exchanging cash.
          </p>

          {/* Search form */}
          <div className="mb-5 fade-up-3">
            <HeroSearch />
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
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/20 text-xs tracking-widest uppercase lg:flex">
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"/>
          scroll
        </div>
      </section>

      {/* Primary homepage CTAs */}
      <section className="bg-navydark px-4 py-6 md:py-8">
        <div className="fade-up-3 mx-auto flex w-full max-w-6xl flex-col items-stretch gap-4">
          <Link href="/sell"
            className="group relative flex h-[90px] w-full items-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#FF9800_0%,#FFB300_100%)] p-[20px_24px] pr-16 text-left text-yellow-950 shadow-[0_24px_54px_rgba(255,152,0,0.32),0_10px_24px_rgba(4,12,24,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_68px_rgba(255,152,0,0.42),0_14px_32px_rgba(4,12,24,0.3)] md:h-auto md:min-h-[104px] md:pr-[88px]">
            <span className="flex min-w-0 items-center gap-2 md:gap-5">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-yellow-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_12px_24px_rgba(120,75,0,0.18)] md:h-16 md:w-16">
                <svg aria-hidden="true" viewBox="0 0 64 64" className="h-11 w-11 md:h-12 md:w-12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 38h40l-3.8-11.4A8 8 0 0 0 40.6 21H25.5a8 8 0 0 0-7.4 5L12 38Z" fill="#FFB300"/>
                  <path d="M18.4 32.2 21 26.7A5 5 0 0 1 25.5 24h15.1a5 5 0 0 1 4.7 3.4l1.6 4.8H18.4Z" fill="#FFE4A3"/>
                  <path d="M10 36.5h44a4 4 0 0 1 4 4V46a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-5.5a4 4 0 0 1 4-4Z" fill="#FF9800"/>
                  <path d="M6 43h8M50 43h8" stroke="#7A3F00" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="19" cy="49" r="6" fill="#1D2633"/>
                  <circle cx="45" cy="49" r="6" fill="#1D2633"/>
                  <circle cx="19" cy="49" r="2.2" fill="#FFB300"/>
                  <circle cx="45" cy="49" r="2.2" fill="#FFB300"/>
                  <circle cx="49" cy="17" r="8" fill="#18A66A"/>
                  <path d="m45.5 17 2.3 2.3 5-5.3" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M52 25.5c2.6.7 4.5 3 4.5 5.8 0 1.5-.6 2.9-1.5 4l3 3" stroke="#7A3F00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="56.7" cy="39.2" r="1.8" fill="#7A3F00"/>
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[22px] font-bold leading-none">Sell your car free</span>
                <span className="mt-0.5 block text-[14px] font-medium leading-[14px] text-yellow-950/80 md:mt-1.5 md:leading-tight">List your car in minutes and reach serious buyers.</span>
              </span>
            </span>
            <span className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 flex-shrink-0 items-center justify-center rounded-full bg-white/25 text-yellow-950 transition-transform duration-300 group-hover:translate-x-1.5 md:right-6 md:h-12 md:w-12">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
          <Link href="/cars"
            className="group flex min-h-[62px] w-full items-center justify-center gap-3 rounded-[18px] border border-[#FF9800]/70 bg-[#08162D] px-6 py-4 text-sm font-bold text-white shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFB300] hover:bg-[#0B1E3D] hover:shadow-[0_18px_42px_rgba(0,0,0,0.28)] md:min-h-[68px] md:text-base">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-[#FFB300] ring-1 ring-[#FF9800]/35 transition-transform duration-300 group-hover:scale-105">
              <svg aria-hidden="true" viewBox="0 0 64 64" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 37h31l-3-8.5A6 6 0 0 0 31.4 25H20a6 6 0 0 0-5.5 3.6L9 37Z" fill="currentColor" opacity=".95"/>
                <path d="M15 33.5 17 29a3 3 0 0 1 2.8-1.8h11.4a3 3 0 0 1 2.8 2l1.5 4.3H15Z" fill="#0B1E3D"/>
                <path d="M7 36h36a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a3 3 0 0 1 2-3Z" fill="#FF9800"/>
                <circle cx="15" cy="46" r="4.5" fill="#F8FAFC"/>
                <circle cx="36" cy="46" r="4.5" fill="#F8FAFC"/>
                <circle cx="15" cy="46" r="1.6" fill="#08162D"/>
                <circle cx="36" cy="46" r="1.6" fill="#08162D"/>
                <circle cx="44" cy="22" r="9" stroke="#F8FAFC" strokeWidth="3"/>
                <path d="m50.5 28.5 7 7" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Browse verified cars</span>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 bg-navydark text-white md:grid-cols-4">
        {[
          { n:'5', l:'Cities covered' },
          { n:'300', l:'Inspection points' },
          { n:'1,100+', l:'Deals completed' },
          { n:'100%', l:'Payment guarantee' },
        ].map((st,i) => (
          <div key={st.l} className={`px-3 py-5 text-center md:px-6 md:py-8 ${i < 3 ? 'border-r border-white/8' : ''}`}>
            <div className="text-2xl font-black text-gold md:text-3xl">{st.n}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300/60 md:text-xs">{st.l}</div>
          </div>
        ))}
      </section>

      {/* Trust pages */}
      <section className="bg-white px-4 py-10 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-col gap-2 md:mb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gold md:text-sm">Trust & support</p>
              <h2 className="mt-2 text-xl font-black text-gray-900 md:text-3xl">Clear company, contact, review, and policy pages.</h2>
            </div>
            <Link href="/contact" className="text-sm font-black text-navy hover:text-gold">Contact Vehiqal →</Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
            {[
              { href:'/about', title:'About', text:'Who we are and how inspected deals work.' },
              { href:'/contact', title:'Contact', text:'Phone, WhatsApp, email, and support hours.' },
              { href:'/reviews', title:'Reviews', text:'Feedback channels for buyers and sellers.' },
              { href:'/privacy', title:'Privacy', text:'How customer and listing data is handled.' },
              { href:'/terms', title:'Terms', text:'Marketplace rules for listings, bids, and deals.' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="min-w-[210px] snap-start rounded-lg border border-gray-100 bg-gray-50 p-4 transition hover:border-navy/20 hover:bg-white hover:shadow-sm md:min-w-0 md:p-5">
                <h3 className="font-black text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ RESPONSIBILITY — "We take your headache" ══ */}
      <section className="bg-white px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-goldlight px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-yellow-800 md:mb-5 md:px-4 md:py-2">
                🤝 Our Responsibility
              </div>
              <h2 className="mb-4 text-3xl font-black leading-tight text-navy md:mb-5 md:text-5xl">
                We take your<br/>
                <span className="text-gold">headache away</span>
              </h2>
              <p className="mb-3 text-base leading-relaxed text-gray-500 md:mb-4 md:text-lg">
                Buying or selling a car in Pakistan has always been stressful. Hidden faults, payment risks, strangers at your door.
              </p>
              <p className="mb-5 text-base font-medium leading-relaxed text-gray-700 md:mb-8 md:text-lg">
                We built Vehiqal to take all of that off your plate on inspected cars. From the first inspection to the final payment, <strong>we are responsible for inspected car deals.</strong>
              </p>
              <div className="rounded-r-lg border-l-4 border-gold bg-gold/10 px-4 py-3 md:px-5 md:py-4">
                <p className="text-lg font-black text-navy md:text-xl">Payment &amp; Car Guarantee</p>
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
                <div key={card.title} className={`${card.bg} border-l-4 ${card.color} rounded-lg p-4 md:p-5`}>
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
      <section className="border-y border-gold/20 bg-gradient-to-br from-goldlight to-[#FFF9EE] px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center md:mb-12">
            <div className="trusted-badge text-sm px-4 py-2 mb-5">✓ Inspected by Vehiqal</div>
            <h2 className="mb-3 text-3xl font-black text-navy md:mb-4 md:text-5xl">
              We inspect every car.<br />
              <span className="text-gold">So you don&apos;t have to.</span>
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600 md:text-lg">
              Every verified car is physically inspected across 10 sections before listing. You see the full report and score before placing any bid.
            </p>
          </div>
          <div className="mb-8 grid grid-cols-2 gap-2 md:mb-10 md:grid-cols-5 md:gap-3">
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
              <div key={s.n} className="relative rounded-lg border border-gold/20 bg-white p-3 shadow-sm md:p-4">
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

      {/* ══ CITY LINKS ══ */}
      <section className="bg-navylight px-4 py-10 md:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 text-center md:mb-8">
            <h2 className="mb-2 text-2xl font-black text-navy">Find cars near you</h2>
            <p className="text-gray-500 text-sm">Currently serving Punjab — expanding soon</p>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-3 md:mb-6 md:grid-cols-5 md:gap-4">
            {punjabCities.map(city => (
              <Link key={city.name} href={`/cars-for-sale-${city.slug}`}
                className="group rounded-lg border border-transparent bg-white p-4 text-center transition-all hover:border-navy hover:shadow-md md:p-5">
                <div className="text-2xl mb-2">🏙️</div>
                <div className="font-bold text-gray-800 group-hover:text-navy text-sm">{city.name}</div>
              </Link>
            ))}
          </div>
          <p className="text-center text-gray-400 text-xs">Also available in Karachi, Islamabad, Rawalpindi and more cities</p>
        </div>
      </section>

      {/* ══ CONTACT / FINAL CTA ══ */}
      <section className="bg-navydark px-4 py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="mb-3 text-3xl font-black text-white md:mb-4 md:text-4xl">
              Ready to buy or sell?
            </h2>
            <p className="mb-5 text-base leading-relaxed text-blue-300/70 md:mb-6 md:text-lg">
              Browse verified cars or list yours for free. Every deal is managed by us — safely and transparently.
            </p>
            <div className="mb-6 flex flex-wrap gap-3 md:mb-8">
              <Link href="/cars" className="btn-gold">Browse cars</Link>
              <Link href="/sell" className="btn-white">List your car free</Link>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-gold font-black text-lg">We take your headache.</p>
              <p className="text-blue-300/60 text-sm mt-1">Payment &amp; Car Guarantee on every deal.</p>
            </div>
          </div>
          <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-[#1A4A9E] to-navy p-5 text-center md:rounded-2xl md:p-8">
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
