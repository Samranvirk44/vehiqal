import type { Metadata } from 'next'
import { CityCarsPage } from '@/components/CityCarsPage'
export const metadata: Metadata = {
  title: 'Used Cars for Sale in Sheikhupura — Vehiqal',
  description: 'Browse verified used cars in Sheikhupura. 300-point inspections. Payment guaranteed. Call 0303 4642619.',
}
export default function Page() { return <CityCarsPage city="Sheikhupura" /> }
