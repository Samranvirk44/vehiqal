import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SellForm } from '@/app/sell/SellForm'
export const metadata: Metadata = {
  title: 'Sell Your Car in Sheikhupura — Free on Vehiqal',
  description: 'Sell your car in Sheikhupura safely. Free listing, verified buyers, payment guaranteed. Call 0303 4642619.',
}
export default function Page() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Sell Your Car in Sheikhupura</h1>
        <p className="text-gray-500 text-lg">Free listing · Verified buyers · Payment guaranteed</p>
      </div>
      <Suspense fallback={<div className="card p-8 text-center text-gray-500">Loading form...</div>}>
        <SellForm />
      </Suspense>
    </div>
  )
}
