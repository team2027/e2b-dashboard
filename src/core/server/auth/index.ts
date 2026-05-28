import 'server-only'

import type { NextRequest, NextResponse } from 'next/server'
import { isOryAuthEnabled, USE_MOCK_DATA } from '@/configs/flags'
import type { AuthAdmin } from './admin'
import { mockAuthAdmin } from './mock/admin'
import {
  createMockAuthForHeaders,
  createMockAuthForProxy,
  createMockAuthProvider,
} from './mock/provider'
import { oryAuthAdmin } from './ory/admin'
import {
  createOryAuthForHeaders,
  createOryAuthForProxy,
  OryHostedAuthProvider,
} from './ory/provider'
import type { AuthProvider } from './provider'
import { supabaseAuthAdmin } from './supabase/admin'
import {
  createSupabaseAuthForHeaders,
  createSupabaseAuthForProxy,
  SupabaseAuthProvider,
} from './supabase/provider'

export const auth: AuthProvider = USE_MOCK_DATA
  ? createMockAuthProvider()
  : isOryAuthEnabled()
    ? new OryHostedAuthProvider()
    : new SupabaseAuthProvider()

export const authAdmin: AuthAdmin = USE_MOCK_DATA
  ? mockAuthAdmin
  : isOryAuthEnabled()
    ? oryAuthAdmin
    : supabaseAuthAdmin

export function createAuthForProxy(
  request: NextRequest,
  response: NextResponse
): AuthProvider {
  if (USE_MOCK_DATA) return createMockAuthForProxy(request, response)
  return isOryAuthEnabled()
    ? createOryAuthForProxy(request, response)
    : createSupabaseAuthForProxy(request, response)
}

export function createAuthForHeaders(headers: Headers): AuthProvider {
  if (USE_MOCK_DATA) return createMockAuthForHeaders(headers)
  return isOryAuthEnabled()
    ? createOryAuthForHeaders(headers)
    : createSupabaseAuthForHeaders(headers)
}

export type { AuthAdmin } from './admin'
export type { AuthUser } from './types'
