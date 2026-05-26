import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_PHONE_DISPLAY, GOOGLE_BUSINESS_URL, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Vehiqal Reviews - Buyer and Seller Trust',
  description:`Read how Vehiqal collects buyer and seller feedback for inspected car deals, listing support, and safer transactions. Call ${CONTACT_PHONE_DISPLAY}.`,
  path:'/reviews',
  keywords:['Vehiqal reviews','car marketplace reviews Pakistan','trusted inspected cars Pakistan','customer feedback Vehiqal'],
})

const reviewTopics = [
  { title:'Inspection clarity', text:'Customers can review whether photos, inspection details, condition, and car information were clear.' },
  { title:'Deal support', text:'Buyers and sellers can rate how helpful Vehiqal was during bidding, calls, and coordination.' },
  { title:'Payment confidence', text:'For inspected cars, customers can share feedback about the payment and handover experience.' },
]

export default function ReviewsPage() {
  return (
    <div className="bg-white">
      <section className="bg-navydark px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-gold">Reviews</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">Customer feedback helps keep Vehiqal accountable.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-200">
            We collect feedback from buyers and sellers after deals so the marketplace keeps improving.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {reviewTopics.map(topic => (
            <div key={topic.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-navy">{topic.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{topic.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl bg-navylight p-6">
            <h2 className="text-2xl font-black text-gray-900">Leave a review</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              If you bought, sold, listed, or requested inspection through Vehiqal, your review helps other customers decide with confidence.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {GOOGLE_BUSINESS_URL ? (
                <a href={GOOGLE_BUSINESS_URL} target="_blank" rel="noopener noreferrer" className="btn-navy">Review on Google</a>
              ) : (
                <Link href="/contact" className="btn-navy">Send feedback</Link>
              )}
              <a href="mailto:info@vehiqal.com" className="btn-outline">Email feedback</a>
            </div>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-goldlight p-6">
            <p className="text-sm font-black uppercase tracking-wide text-yellow-900">Trust note</p>
            <p className="mt-3 text-sm leading-relaxed text-yellow-900">
              We do not publish fake testimonials. Public reviews should come from real customers and verified Google or direct feedback channels.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
