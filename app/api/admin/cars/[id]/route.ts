import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { hasAdminCookie } from '@/lib/adminServer'
import { getAdminDb, getFirebaseAdminErrorMessage, hasFirebaseAdminCredentials } from '@/lib/firebaseAdmin'
import type { CarStatus } from '@/lib/cars'

export const runtime = 'nodejs'

const VALID_STATUSES: CarStatus[] = ['active', 'sold', 'removed']

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!hasAdminCookie()) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const status = String(body.status ?? '') as CarStatus
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid car status.' }, { status: 400 })
  }

  if (!hasFirebaseAdminCredentials()) {
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(new Error('client_email private_key')) }, { status: 503 })
  }

  try {
    await getAdminDb().collection('cars').doc(params.id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true, status })
  } catch (error) {
    console.error('Admin car update API error:', error)
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(error) }, { status: 500 })
  }
}
