import 'server-only'

import { emailToMockUserId, writeMockSession } from './session'

export const mockAuthFlows = {
  async signIn(email: string): Promise<void> {
    const id = await emailToMockUserId(email)
    await writeMockSession({ id, email, providers: ['email'] })
  },

  async signInWithProvider(
    email: string,
    provider: string
  ): Promise<void> {
    const id = await emailToMockUserId(email)
    await writeMockSession({ id, email, providers: [provider] })
  },
}
