import 'server-only'

import type { NextRequest, NextResponse } from 'next/server'
import type { AuthProvider } from '../provider'
import type { AuthContext, SignOutOptions, SignOutResult } from '../types'
import type { MockSessionPayload } from './session'
import {
  clearMockSession,
  readMockSession,
  readMockSessionFromHeaders,
  readMockSessionFromRequest,
  toAuthUser,
} from './session'

export class MockAuthProvider implements AuthProvider {
  constructor(
    private readonly read: () => Promise<MockSessionPayload | null>
  ) {}

  async getAuthContext(): Promise<AuthContext | null> {
    const payload = await this.read()
    if (!payload) return null
    return { user: toAuthUser(payload), accessToken: 'mock-access-token' }
  }

  async signOut(_options?: SignOutOptions): Promise<SignOutResult> {
    await clearMockSession()
    return { error: null }
  }
}

export class MockAuthProviderForProxy implements AuthProvider {
  constructor(private readonly request: NextRequest) {}

  getAuthContext(): Promise<AuthContext | null> {
    const payload = readMockSessionFromRequest(this.request)
    if (!payload) return Promise.resolve(null)
    return Promise.resolve({
      user: toAuthUser(payload),
      accessToken: 'mock-access-token',
    })
  }

  signOut(_options?: SignOutOptions): Promise<SignOutResult> {
    return Promise.resolve({ error: null })
  }
}

export class MockAuthProviderForHeaders implements AuthProvider {
  constructor(private readonly headers: Headers) {}

  getAuthContext(): Promise<AuthContext | null> {
    const payload = readMockSessionFromHeaders(this.headers)
    if (!payload) return Promise.resolve(null)
    return Promise.resolve({
      user: toAuthUser(payload),
      accessToken: 'mock-access-token',
    })
  }

  signOut(_options?: SignOutOptions): Promise<SignOutResult> {
    return Promise.resolve({ error: null })
  }
}

export function createMockAuthProvider(): MockAuthProvider {
  return new MockAuthProvider(readMockSession)
}

export function createMockAuthForProxy(
  request: NextRequest,
  _response: NextResponse
): MockAuthProviderForProxy {
  return new MockAuthProviderForProxy(request)
}

export function createMockAuthForHeaders(
  headers: Headers
): MockAuthProviderForHeaders {
  return new MockAuthProviderForHeaders(headers)
}
