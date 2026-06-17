import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Test - Vehiqal',
  description:'Internal Vehiqal test route.',
  path:'/test',
  noIndex:true,
})

export default function RemovedTestPage() {
  redirect('/')
}
