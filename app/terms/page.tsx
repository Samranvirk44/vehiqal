import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Terms and Conditions - Vehiqal',
  description:'Read Vehiqal terms for car listings, bids, inspections, payment support, sold status, user accounts, and marketplace responsibilities.',
  path:'/terms',
  keywords:['Vehiqal terms','car marketplace terms Pakistan','used car listing terms'],
})

const sections = [
  ['Use of Vehiqal', 'Vehiqal provides a marketplace for car listings, buyer interest, bids, inspection requests, and support around inspected-car transactions. You must provide accurate information and use the platform lawfully.'],
  ['Listings', 'Sellers are responsible for submitting accurate vehicle details, photos, ownership information, price, condition, mileage, and contact details. Vehiqal may edit, reject, remove, inspect, verify, or mark listings sold where needed.'],
  ['Inspected cars', 'Inspected or verified cars may receive a badge and inspection information after admin review. Inspection results are based on checks performed at the time of inspection and do not remove the need for buyer judgment.'],
  ['Bids and offers', 'Buyer bids are expressions of interest and may be accepted, rejected, or reviewed by the seller or admin depending on the flow. A bid is not a completed sale until the parties and Vehiqal complete the agreed process.'],
  ['Payments and handover', 'Vehiqal may help manage payment and handover for inspected cars. Final steps, timelines, and responsibilities may depend on the specific deal, documents, vehicle condition, and parties involved.'],
  ['User accounts', 'Users are responsible for keeping their login access secure and for ensuring their phone number and account details are correct.'],
  ['Content removal', 'Vehiqal may remove listings, bids, reviews, or user content that appears false, unsafe, abusive, misleading, duplicated, sold, or against platform rules.'],
  ['Changes to terms', 'Vehiqal may update these terms as the product, inspection flow, admin workflow, or marketplace rules change.'],
]

export default function TermsPage() {
  return (
    <article className="bg-white px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-gold">Terms and Conditions</p>
        <h1 className="text-4xl font-black text-gray-900">Rules for using Vehiqal</h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: May 26, 2026</p>
        <p className="mt-6 leading-relaxed text-gray-600">
          These terms explain how buyers, sellers, and admins should use Vehiqal. By using the website, you agree to follow these marketplace rules.
        </p>

        <div className="mt-10 space-y-7">
          {sections.map(([title, text]) => (
            <section key={title}>
              <h2 className="text-xl font-black text-navy">{title}</h2>
              <p className="mt-2 leading-relaxed text-gray-600">{text}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-navylight p-6">
          <h2 className="text-xl font-black text-navy">Questions about these terms</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Contact {CONTACT_EMAIL} or call {CONTACT_PHONE_DISPLAY} for support.
          </p>
        </div>
      </div>
    </article>
  )
}
