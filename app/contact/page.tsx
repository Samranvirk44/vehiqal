import type { Metadata } from 'next'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP,
  absoluteUrl,
  breadcrumbJsonLd,
  businessJsonLd,
  GOOGLE_BUSINESS_URL,
  jsonLdGraph,
  pageMeta,
} from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Contact Vehiqal - Car Buying and Selling Support',
  description:`Contact Vehiqal for inspected cars, car listings, bids, payment support, and safe car deals in Pakistan. Call ${CONTACT_PHONE_DISPLAY}.`,
  path:'/contact',
  keywords:['contact Vehiqal','Vehiqal phone number','car inspection support Pakistan','sell car support Pakistan'],
})

const contactJsonLd = jsonLdGraph([
  businessJsonLd(),
  {
    '@type':'ContactPage',
    '@id':`${absoluteUrl('/contact')}#contact`,
    name:'Contact Vehiqal',
    url:absoluteUrl('/contact'),
    mainEntity:{ '@id':absoluteUrl('/#business') },
  },
  breadcrumbJsonLd([
    { name:'Home', path:'/' },
    { name:'Contact', path:'/contact' },
  ]),
])

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(contactJsonLd) }}/>
      <div className="bg-white">
        <section className="bg-navydark px-4 py-16 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-gold">Contact Vehiqal</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">Talk to us about buying, selling, inspection, or bids.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-200">
              Our team helps with inspected car deals, listing support, and buyer-seller coordination.
            </p>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-navy/30 hover:shadow-md">
              <p className="text-sm font-black uppercase tracking-wide text-gray-400">Phone</p>
              <p className="mt-3 text-2xl font-black text-navy">{CONTACT_PHONE_DISPLAY}</p>
              <p className="mt-2 text-sm text-gray-500">Call for urgent buyer, seller, or inspection help.</p>
            </a>

            <a href={`https://wa.me/${CONTACT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-green/30 hover:shadow-md">
              <p className="text-sm font-black uppercase tracking-wide text-gray-400">WhatsApp</p>
              <p className="mt-3 text-2xl font-black text-green">Message us</p>
              <p className="mt-2 text-sm text-gray-500">Share a car link, listing issue, or inspection request.</p>
            </a>

            <a href={`mailto:${CONTACT_EMAIL}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-gold/40 hover:shadow-md">
              <p className="text-sm font-black uppercase tracking-wide text-gray-400">Email</p>
              <p className="mt-3 break-words text-2xl font-black text-navy">{CONTACT_EMAIL}</p>
              <p className="mt-2 text-sm text-gray-500">Best for documents, partnerships, and formal requests.</p>
            </a>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl bg-navylight p-6">
              <h2 className="text-2xl font-black text-gray-900">How we can help</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {['Car listing support','Inspection requests','Buyer bid support','Seller dashboard help','Payment and handover guidance','Admin verified-car queries'].map(item => (
                  <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-navy shadow-sm">{item}</div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900">Business hours</h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">Monday to Saturday, 9am to 7pm Pakistan time.</p>
              <div className="mt-5 rounded-xl bg-goldlight p-4">
                <p className="text-sm font-black text-yellow-900">Google Business Profile</p>
                <p className="mt-1 text-sm text-yellow-800">
                  After Google verifies Vehiqal, connect the official profile URL so customers can find directions, reviews, and updates from Google Search and Maps.
                </p>
                {GOOGLE_BUSINESS_URL && (
                  <a href={GOOGLE_BUSINESS_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-black text-navy hover:text-gold">
                    View Google profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
