import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SellForm } from './SellForm'
import { CONTACT_PHONE_DISPLAY, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Sell Your Car in Pakistan - Free Listing',
  description:`List your car free on Vehiqal, reach verified buyers, request inspection, and get support for a safer deal. Call ${CONTACT_PHONE_DISPLAY}.`,
  path:'/sell',
  keywords:['sell car Pakistan','list car free Pakistan','sell used car Pakistan','car buyers Pakistan'],
})
export default function SellPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">List your car — it&apos;s free</h1>
        <p className="text-gray-500 text-lg">Reach verified buyers. We handle the deal. Payment guaranteed.</p>
        <div className="flex justify-center gap-6 mt-5 text-sm text-gray-500 flex-wrap">
          {['Free to list','Verified buyers','Safe payment'].map(f => (
            <div key={f} className="flex items-center gap-1.5"><span className="text-green font-bold">✓</span>{f}</div>
          ))}
        </div>
      </div>
      <Suspense fallback={<div className="card p-8 text-center text-gray-500">Loading form...</div>}>
        <SellForm />
      </Suspense>
    </div>
  )
}
