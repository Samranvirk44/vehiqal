import type { Metadata } from 'next'
import { CarsClient } from './CarsClient'

export const metadata: Metadata = {
  title: 'Used Cars for Sale in Pakistan — Verified Listings',
  description: 'Browse verified used cars across Pakistan. Every car inspected with 300-point checklist. Call 0303 4642619.',
}

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
