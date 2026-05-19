import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { hasAdminCookie } from '@/lib/adminServer'
import { getAdminDb, getFirebaseAdminErrorMessage, hasFirebaseAdminCredentials } from '@/lib/firebaseAdmin'
import type { CarStatus, VerificationStatus } from '@/lib/cars'

export const runtime = 'nodejs'

const VALID_STATUSES: CarStatus[] = ['active', 'sold', 'removed']
const VALID_VERIFICATION_STATUSES: VerificationStatus[] = ['none', 'requested', 'inspecting', 'verified', 'rejected']

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!hasAdminCookie()) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const status = body.status ? String(body.status) as CarStatus : undefined
  const verificationStatus = body.verificationStatus ? String(body.verificationStatus) as VerificationStatus : undefined
  const inspectionReport = body.inspectionReport && typeof body.inspectionReport === 'object' ? body.inspectionReport : undefined
  const hasOverallScore = Object.prototype.hasOwnProperty.call(body, 'overallScore')
  const overallScore = !hasOverallScore ? undefined : body.overallScore === null ? null : Number(body.overallScore)
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid car status.' }, { status: 400 })
  }
  if (verificationStatus && !VALID_VERIFICATION_STATUSES.includes(verificationStatus)) {
    return NextResponse.json({ error: 'Invalid verification status.' }, { status: 400 })
  }
  if (typeof overallScore === 'number' && (!Number.isFinite(overallScore) || overallScore < 0 || overallScore > 10)) {
    return NextResponse.json({ error: 'Invalid inspection score.' }, { status: 400 })
  }
  if (!status && !verificationStatus && !inspectionReport && overallScore === undefined) {
    return NextResponse.json({ error: 'No car update provided.' }, { status: 400 })
  }

  if (!hasFirebaseAdminCredentials()) {
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(new Error('client_email private_key')) }, { status: 503 })
  }

  try {
    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (status) updates.status = status
    if (verificationStatus) {
      updates.verificationStatus = verificationStatus
      if (verificationStatus === 'requested') {
        updates.isTrusted = false
        updates.verificationRequestedAt = FieldValue.serverTimestamp()
      } else if (verificationStatus === 'inspecting') {
        updates.isTrusted = false
        updates.inspectionStartedAt = FieldValue.serverTimestamp()
      } else if (verificationStatus === 'verified') {
        updates.isTrusted = true
        updates.verifiedAt = FieldValue.serverTimestamp()
        updates.verifiedBy = 'admin'
      } else if (verificationStatus === 'rejected') {
        updates.isTrusted = false
        updates.overallScore = null
        updates.inspectionReport = null
        updates.verificationRejectedAt = FieldValue.serverTimestamp()
      } else {
        updates.isTrusted = false
        updates.overallScore = null
        updates.inspectionReport = null
      }
    }
    if (overallScore !== undefined) updates.overallScore = overallScore
    if (inspectionReport) {
      updates.inspectionReport = {
        ...inspectionReport,
        updatedAt: FieldValue.serverTimestamp(),
        ...(verificationStatus === 'verified' ? { completedAt: FieldValue.serverTimestamp() } : {}),
      }
    }
    await getAdminDb().collection('cars').doc(params.id).update(updates)
    return NextResponse.json({ ok: true, status, verificationStatus })
  } catch (error) {
    console.error('Admin car update API error:', error)
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(error) }, { status: 500 })
  }
}
