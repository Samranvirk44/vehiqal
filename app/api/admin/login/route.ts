import { NextResponse } from 'next/server'
import { isAdminCredentials, setAdminCookie } from '@/lib/adminServer'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const username = String(body.username ?? '')
  const password = String(body.password ?? '')

  if (!isAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid admin username or password.' }, { status: 401 })
  }

  setAdminCookie()
  return NextResponse.json({ ok: true })
}
