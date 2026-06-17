import type { Metadata } from 'next'
import { AdminDashboardClient } from './AdminDashboardClient'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Admin - Vehiqal',
  description:'Vehiqal admin dashboard.',
  path:'/admin',
  noIndex:true,
})

export default function AdminPage() {
  return <AdminDashboardClient />
}
