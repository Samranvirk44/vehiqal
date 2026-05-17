import type { Metadata } from 'next'
import { SellForm } from './SellForm'
export const metadata: Metadata = {
  title: 'Sell Your Car in Pakistan — Free Listing on Vehiqal',
  description: 'List your car free. Reach verified buyers. We manage payment and deal. Call 0311 4642679.',
}
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
      <SellForm />
    </div>
  )
}
