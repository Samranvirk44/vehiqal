import type { Metadata } from 'next'
import { CarsClient } from './CarsClient'
import { CONTACT_PHONE_DISPLAY, breadcrumbJsonLd, carsCollectionJsonLd, jsonLdGraph, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Used Cars for Sale in Pakistan - Inspected Listings',
  description:`Browse used cars for sale across Pakistan. Inspected listings appear first and include 300-point checks. Call ${CONTACT_PHONE_DISPLAY}.`,
  path:'/cars',
  keywords:['used cars for sale Pakistan','inspected cars Pakistan','verified car listings','buy used car Pakistan'],
})

const carsJsonLd = jsonLdGraph([
  carsCollectionJsonLd({
    title:'Used Cars for Sale in Pakistan',
    description:'Browse used cars for sale in Pakistan. Inspected cars appear first and include vehicle checks, seller contact, photos, and deal support.',
    path:'/cars',
  }),
  breadcrumbJsonLd([
    { name:'Home', path:'/' },
    { name:'Cars', path:'/cars' },
  ]),
])

export default function CarsPage({
  searchParams,
}: {
  searchParams: { city?: string; make?: string; trusted?: string }
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(carsJsonLd) }}/>
      <CarsClient
        initialCity={searchParams.city || 'All'}
        initialMake={searchParams.make || 'All'}
        initialTrusted={searchParams.trusted === 'true'}
      />
    </>
  )
}
