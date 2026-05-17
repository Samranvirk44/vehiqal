export const ADMIN_SESSION_KEY = 'vehiqal-admin-session'
export const ADMIN_PHONE_NUMBERS = ['+923114642679']
export const ADMIN_EMAILS = ['admin.vehiqal@gmail.com']

export function isAdminPhoneNumber(phone?: string | null) {
  if (!phone) return false
  const normalized = phone.replace(/\s/g, '')
  return ADMIN_PHONE_NUMBERS.includes(normalized)
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return ADMIN_EMAILS.includes(normalized)
}

export function isAdminIdentity(user?: { email?: string | null; phoneNumber?: string | null } | null) {
  return isAdminEmail(user?.email) || isAdminPhoneNumber(user?.phoneNumber)
}

export function setAdminSession() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_SESSION_KEY, 'true')
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function hasAdminSession() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}
