'use client'

import { createBrowserClient } from '@supabase/ssr'
import { USE_MOCK_DATA } from '@/configs/flags'
import type { Database } from '@/core/shared/contracts/database.types'

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>

// In mock mode there is no Supabase project, so the real client would throw
// at module load ("URL and API key are required"). Return a no-op stub: auth
// is handled by the cookie-based mock provider, not this browser client.
function createMockBrowserClient(): BrowserClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            id: 'mock',
            callback: () => {},
            unsubscribe: () => {},
          },
        },
      }),
    },
  } as unknown as BrowserClient
}

export const supabase: BrowserClient = USE_MOCK_DATA
  ? createMockBrowserClient()
  : createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
