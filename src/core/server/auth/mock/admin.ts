import 'server-only'

import type { AuthAdmin } from '../admin'
import type { AuthUser } from '../types'
import { emailToMockUserId } from './session'

async function synthesizeUser(id: string): Promise<AuthUser> {
  const email = `mock+${id}@example.com`
  return { id, email, name: null, avatarUrl: null, providers: ['mock'] }
}

export const mockAuthAdmin: AuthAdmin = {
  async getUserById(userId) {
    return synthesizeUser(userId)
  },

  async getEmailsByIds(userIds) {
    const result = new Map<string, string | null>()
    for (const id of userIds) {
      result.set(id, `mock+${id}@example.com`)
    }
    return result
  },
}

export { emailToMockUserId }
