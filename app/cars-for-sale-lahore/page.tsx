import type { Metadata } from 'next'
import { CityCarsPage } from '@/components/CityCarsPage'
export const metadata: Metadata = {
  title: 'Used Cars for Sale in Lahore — Vehiqal',
  description: 'Browse verified used cars in Lahore. 300-point inspections. Payment guaranteed. Call 0311 4642679.',
}
export default function Page() { return <CityCarsPage city="Lahore" /> }
