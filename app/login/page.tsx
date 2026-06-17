import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'
import { VehiqalIcon } from '@/components/VehiqalLogo'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title:'Sign in - Vehiqal',
  description:'Sign in to your Vehiqal account.',
  path:'/login',
  noIndex:true,
})

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <VehiqalIcon size={44}/>
            <span className="font-black text-3xl"><span className="text-navy">Veh</span><span className="text-gold">iq</span><span className="text-navy">al</span></span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Sign in or register</h1>
          <p className="text-gray-500 text-sm mt-2">Use your phone number to continue</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm/>
        </Suspense>
      </div>
    </div>
  )
}
