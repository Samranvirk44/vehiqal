import type { Metadata } from 'next'
import { CityCarsPage } from '@/components/CityCarsPage'
import { cityCarsMeta } from '@/lib/seo'
export const metadata: Metadata = cityCarsMeta('Islamabad')
export default function Page() { return <CityCarsPage city="Islamabad" /> }
