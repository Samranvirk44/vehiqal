import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { hasAdminCookie } from '@/lib/adminServer'
import { getAdminDb, getFirebaseAdminErrorMessage, hasFirebaseAdminCredentials } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!hasAdminCookie()) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const status = String(body.status ?? '')
  if (status !== 'accepted' && status !== 'rejected') {
    return NextResponse.json({ error: 'Invalid bid status.' }, { status: 400 })
  }

  if (!hasFirebaseAdminCredentials()) {
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(new Error('client_email private_key')) }, { status: 503 })
  }

  try {
    await getAdminDb().collection('bids').doc(params.id).update({
      status,
      decisionBy: 'admin',
      decidedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true, status })
  } catch (error) {
    console.error('Admin bid update API error:', error)
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(error) }, { status: 500 })
  }
}
