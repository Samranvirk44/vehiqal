import { RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
export type { User }
export const onAuthChange = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb)
export async function getUserProfile(uid: string): Promise<any | null> {
  const snap = await getDoc(doc(db,'users',uid))
  return snap.exists() ? { id:snap.id, ...snap.data() } : null
}
export async function getUserProfiles(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const entries = await Promise.all(uniqueIds.map(async id => {
    try {
      return [id, await getUserProfile(id)] as const
    } catch (error) {
      console.error('getUserProfile error:', id, error)
      return [id, null] as const
    }
  }))
  return Object.fromEntries(entries)
}
export async function createUserProfile(uid: string, data: any) {
  const userRef = doc(db,'users',uid)
  const snap = await getDoc(userRef)
  return setDoc(
    userRef,
    {
      ...data,
      ...(!snap.exists() ? { createdAt:serverTimestamp() } : {}),
      updatedAt:serverTimestamp(),
    },
    { merge:true }
  )
}
export const signOut = () => firebaseSignOut(auth)
export const setupRecaptcha = (id: string) => new RecaptchaVerifier(auth, id, { size:'invisible' })
export const sendOTP = (phone: string, recaptcha: RecaptchaVerifier) => signInWithPhoneNumber(auth, phone, recaptcha)
