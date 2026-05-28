import 'server-only'

import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import type { AuthUser } from '../types'

const COOKIE_NAME = 'e2b_mock_auth'

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30,
}

export type MockSessionPayload = {
  id: string
  email: string
  providers: string[]
}

async function digestEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export async function emailToMockUserId(email: string): Promise<string> {
  return digestEmail(email)
}

export function toAuthUser(payload: MockSessionPayload): AuthUser {
  return {
    id: payload.id,
    email: payload.email,
    name: null,
    avatarUrl: null,
    providers: payload.providers,
  }
}

export async function readMockSession(): Promise<MockSessionPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockSessionPayload
  } catch {
    return null
  }
}

export async function writeMockSession(
  payload: MockSessionPayload
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(payload), COOKIE_OPTIONS)
}

export async function clearMockSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function readMockSessionFromRequest(
  request: NextRequest
): MockSessionPayload | null {
  const raw = request.cookies.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockSessionPayload
  } catch {
    return null
  }
}

export function readMockSessionFromHeaders(
  headers: Headers
): MockSessionPayload | null {
  const cookieHeader = headers.get('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null
  const raw = decodeURIComponent(match.slice(COOKIE_NAME.length + 1))
  try {
    return JSON.parse(raw) as MockSessionPayload
  } catch {
    return null
  }
}

export function writeMockSessionToResponse(
  payload: MockSessionPayload,
  response: NextResponse
): void {
  response.cookies.set(COOKIE_NAME, JSON.stringify(payload), COOKIE_OPTIONS)
}
