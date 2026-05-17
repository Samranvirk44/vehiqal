import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE_NAME = 'vehiqal-admin-auth'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin.vehiqal@gmail.com'
const ADMIN_USERNAME_ALIASES = ['admin', 'VehiQalAdmin']
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Murdoch@1234'
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || ADMIN_PASSWORD
const SESSION_PAYLOAD = 'vehiqal-admin'

function sign(value: string) {
  return createHmac('sha256', ADMIN_SESSION_SECRET).update(value).digest('hex')
}

function createSessionValue() {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`
}

function verifySessionValue(value?: string) {
  if (!value) return false
  const [payload, signature] = value.split('.')
  if (payload !== SESSION_PAYLOAD || !signature) return false

  const expected = sign(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function isAdminCredentials(username: string, password: string) {
  const normalized = username.trim().toLowerCase()
  return (normalized === ADMIN_USERNAME.toLowerCase() || ADMIN_USERNAME_ALIASES.some(alias => normalized === alias.toLowerCase())) && password === ADMIN_PASSWORD
}

export function hasAdminCookie() {
  return verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)
}

export function setAdminCookie() {
  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: createSessionValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
}

export function clearAdminCookie() {
  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
