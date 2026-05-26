import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Privacy Policy - Vehiqal',
  description:'Read the Vehiqal privacy policy for car listings, buyer bids, contact details, photos, account data, and marketplace communications.',
  path:'/privacy',
  keywords:['Vehiqal privacy policy','car marketplace privacy Pakistan','used car listing privacy'],
})

const sections = [
  ['Information we collect', 'We may collect your name, phone number, email address, car listing details, photos, bids, messages, dashboard activity, and information needed to support inspections or transactions.'],
  ['How we use information', 'We use information to create listings, show buyer and seller contact details where needed, manage bids, support inspected-car deals, prevent misuse, respond to support requests, and improve Vehiqal.'],
  ['Photos and listing data', 'Car photos, make, model, year, city, price, mileage, condition, inspection status, and selected vehicle details may be shown publicly on Vehiqal listing pages.'],
  ['Contact details', 'Seller and buyer contact details may be shared between relevant parties for marketplace communication and deal handling. Admins may access contact details to support inspected-car transactions.'],
  ['Data protection', 'We use Firebase and related systems to store account, listing, bid, and operational data. Access is limited based on the role and purpose of the user.'],
  ['Your choices', 'You can request correction or removal of your personal listing information by contacting Vehiqal. Some records may be kept where required for safety, fraud prevention, or transaction history.'],
]

export default function PrivacyPage() {
  return (
    <article className="bg-white px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-gold">Privacy Policy</p>
        <h1 className="text-4xl font-black text-gray-900">How Vehiqal handles customer and listing data</h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: May 26, 2026</p>
        <p className="mt-6 leading-relaxed text-gray-600">
          This policy explains how Vehiqal collects, uses, and protects information when people browse cars, list cars, place bids, request inspection, or contact our team.
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
          <h2 className="text-xl font-black text-navy">Contact about privacy</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            For privacy questions, corrections, or data removal requests, contact {CONTACT_EMAIL} or call {CONTACT_PHONE_DISPLAY}.
          </p>
        </div>
      </div>
    </article>
  )
}
