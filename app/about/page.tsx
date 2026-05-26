import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_PHONE_DISPLAY, absoluteUrl, breadcrumbJsonLd, businessJsonLd, jsonLdGraph, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'About Vehiqal - Inspected Car Marketplace',
  description:`Learn how Vehiqal helps buyers and sellers in Pakistan with inspected cars, verified listings, payment support, and safer deals. Call ${CONTACT_PHONE_DISPLAY}.`,
  path:'/about',
  keywords:['about Vehiqal','trusted car marketplace Pakistan','inspected car company Pakistan'],
})

const steps = [
  { title:'Inspect the car', text:'Eligible cars can be checked across engine, body, documents, road test, electricals, safety, tyres, and more.' },
  { title:'Publish clear details', text:'Listings are built around photos, condition, inspection status, seller contact, price, mileage, and city.' },
  { title:'Support the deal', text:'For inspected cars, Vehiqal helps manage buyer interest, payment support, and handover coordination.' },
]

const aboutJsonLd = jsonLdGraph([
  businessJsonLd(),
  {
    '@type':'AboutPage',
    '@id':`${absoluteUrl('/about')}#about`,
    name:'About Vehiqal',
    url:absoluteUrl('/about'),
    mainEntity:{ '@id':absoluteUrl('/#business') },
  },
  breadcrumbJsonLd([
    { name:'Home', path:'/' },
    { name:'About', path:'/about' },
  ]),
])

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(aboutJsonLd) }}/>
      <div className="bg-white">
      <section className="bg-navydark px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-gold">About Vehiqal</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Pakistan&apos;s inspected car marketplace, built to make car deals easier.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-200">
            Vehiqal helps people buy and sell cars with clearer information, stronger verification, and practical support during the deal.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            ['300', 'Inspection points'],
            ['10', 'Health sections'],
            ['12+', 'Cities supported'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
              <p className="text-4xl font-black text-navy">{value}</p>
              <p className="mt-2 text-sm font-bold text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Why we exist</h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              Buying or selling a used car can be stressful when vehicle condition, payment, and buyer-seller trust are unclear. Vehiqal focuses on inspected cars and transparent listings so both sides can make better decisions before meeting or bidding.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              We are especially focused on inspected cars, where our team can review vehicle condition and help manage the deal more safely.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-black text-yellow-900">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-black text-navy">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navylight px-4 py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Need help with a car deal?</h2>
            <p className="mt-1 text-sm text-gray-500">Talk to Vehiqal before you buy, sell, or request inspection.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+923034642619" className="btn-navy">Call {CONTACT_PHONE_DISPLAY}</a>
            <Link href="/contact" className="btn-outline">Contact us</Link>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}
