import type { Metadata } from 'next'
import { CityCarsPage } from '@/components/CityCarsPage'
import { cityCarsMeta } from '@/lib/seo'
export const metadata: Metadata = cityCarsMeta('Karachi')
export default function Page() { return <CityCarsPage city="Karachi" /> }
