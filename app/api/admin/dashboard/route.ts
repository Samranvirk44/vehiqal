import { NextResponse } from 'next/server'
import { hasAdminCookie } from '@/lib/adminServer'
import {
  createdAtMillis,
  getAdminDb,
  getFirebaseAdminErrorMessage,
  hasFirebaseAdminCredentials,
  serializeFirestoreValue,
} from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

function toDoc(snapshot: FirebaseFirestore.QueryDocumentSnapshot) {
  return serializeFirestoreValue({ id: snapshot.id, ...snapshot.data() })
}

export async function GET() {
  if (!hasAdminCookie()) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 })
  }

  if (!hasFirebaseAdminCredentials()) {
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(new Error('client_email private_key')) }, { status: 503 })
  }

  try {
    const db = getAdminDb()
    const [carsSnap, bidsSnap, usersSnap] = await Promise.all([
      db.collection('cars').get(),
      db.collection('bids').get(),
      db.collection('users').get(),
    ])

    const cars = carsSnap.docs
      .map(toDoc)
      .sort((a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt))
    const bids = bidsSnap.docs
      .map(toDoc)
      .sort((a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt))
    const profiles = Object.fromEntries(usersSnap.docs.map(doc => [doc.id, toDoc(doc)]))

    return NextResponse.json({ cars, bids, profiles })
  } catch (error) {
    console.error('Admin dashboard API error:', error)
    return NextResponse.json({ error: getFirebaseAdminErrorMessage(error) }, { status: 500 })
  }
}
