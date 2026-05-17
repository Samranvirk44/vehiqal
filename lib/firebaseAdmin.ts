import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminConfig() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
}

export function hasFirebaseAdminCredentials() {
  const { projectId, clientEmail, privateKey } = getAdminConfig()
  return Boolean(projectId && clientEmail && privateKey)
}

function getAdminApp() {
  const existing = getApps()[0]
  if (existing) return existing

  const { projectId, clientEmail, privateKey } = getAdminConfig()

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}

export function serializeFirestoreValue(value: any): any {
  if (!value) return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(serializeFirestoreValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeFirestoreValue(nested)])
    )
  }
  return value
}

export function createdAtMillis(value: any) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime()
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function getFirebaseAdminErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (
    message.includes('Could not load the default credentials') ||
    message.includes('GOOGLE_APPLICATION_CREDENTIALS') ||
    message.includes('private_key') ||
    message.includes('client_email')
  ) {
    return 'Firebase Admin credentials are missing. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local, then restart the dev server.'
  }
  return 'Could not load admin data from Firebase.'
}
