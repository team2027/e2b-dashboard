import 'server-cli-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/core/shared/contracts/database.types'

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'supabaseAdmin: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

let _adminInstance: ReturnType<typeof createSupabaseAdmin> | null = null

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createSupabaseAdmin>,
  {
    get(_target, prop) {
      if (!_adminInstance) {
        _adminInstance = createSupabaseAdmin()
      }
      return (_adminInstance as unknown as Record<string | symbol, unknown>)[
        prop
      ]
    },
  }
)
