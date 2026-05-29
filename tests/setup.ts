import { loadEnvConfig } from '@next/env'
import { vi } from 'vitest'

const projectDir = process.cwd()
loadEnvConfig(projectDir)

// Force the real (non-mock) code paths by default in tests, regardless of
// ambient env. Dev machines set NEXT_PUBLIC_MOCK_DATA=1 in .env.local and CI
// exports it as a job env var; either would make USE_MOCK_DATA truthy and route
// every action through the mock branch instead of the real path under test.
// This runs before any test module imports @/configs/flags, so the module-level
// USE_MOCK_DATA const evaluates to false. Tests that intend to exercise mock
// mode must opt in explicitly via vi.mock('@/configs/flags', ...).
delete process.env.NEXT_PUBLIC_MOCK_DATA
delete process.env.VERCEL_ENV

// fall back to placeholder values for env-coupled clients that initialize at module load
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key'

// mock server-only to prevent vitest errors
vi.mock('server-only', () => ({}))
vi.mock('server-cli-only', () => ({}))

// default mocks
vi.mock('@/core/shared/clients/logger', () => ({
  l: {
    error: console.error,
    info: console.info,
    warn: console.warn,
    debug: console.info,
  },
  logger: {
    error: console.error,
    info: console.info,
    warn: console.warn,
    debug: console.info,
  },
  default: {
    error: console.error,
    info: console.info,
    warn: console.warn,
    debug: console.info,
  },
}))
