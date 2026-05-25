import type { Metadata } from 'next'
import { CarsClient } from './CarsClient'
import { CONTACT_PHONE_DISPLAY, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Used Cars for Sale in Pakistan - Inspected Listings',
  description:`Browse used cars for sale across Pakistan. Inspected listings appear first and include 300-point checks. Call ${CONTACT_PHONE_DISPLAY}.`,
  path:'/cars',
  keywords:['used cars for sale Pakistan','inspected cars Pakistan','verified car listings','buy used car Pakistan'],
})

export default function CarsPage({
  searchParams,
}: {
  searchParams: { city?: string; make?: string; trusted?: string }
}) {
  return (
    <CarsClient
      initialCity={searchParams.city || 'All'}
      initialMake={searchParams.make || 'All'}
      initialTrusted={searchParams.trusted === 'true'}
    />
  )
}
