import type { Metadata } from 'next'
import { CarDetailClient } from './CarDetailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Car listing — Vehiqal',
  description: 'View car details, place a bid, and contact Vehiqal for a verified car deal.',
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  return <CarDetailClient id={params.id} />
}
