import type { Metadata } from 'next'
import { DashboardClient } from './DashboardClient'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Dashboard - Vehiqal',
  description:'Manage your Vehiqal listings, bids, favourites, and account.',
  path:'/dashboard',
  noIndex:true,
})

export default function DashboardPage() { return <DashboardClient/> }
