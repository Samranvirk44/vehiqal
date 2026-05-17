import type { Metadata } from 'next'
import { CityCarsPage } from '@/components/CityCarsPage'
export const metadata: Metadata = {
  title: 'Used Cars for Sale in Islamabad — Vehiqal',
  description: 'Browse verified used cars in Islamabad. 300-point inspections. Payment guaranteed. Call 0311 4642679.',
}
export default function Page() { return <CityCarsPage city="Islamabad" /> }
