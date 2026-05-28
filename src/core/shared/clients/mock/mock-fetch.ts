const API_KEY_PREFIX = 'e2b_'
const MOCK_KEY_ID = 'aaaabbbb-1111-2222-3333-444455556666'

const mockApiKeys: Array<{
  id: string
  name: string
  key: string
  createdAt: string
  createdBy: null
  lastUsed: null
  mask: { prefix: string; valueLength: number; maskedValuePrefix: string; maskedValueSuffix: string }
}> = [
  {
    id: MOCK_KEY_ID,
    name: 'Default',
    key: `${API_KEY_PREFIX}${'a'.repeat(40)}`,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: null,
    lastUsed: null,
    mask: {
      prefix: API_KEY_PREFIX,
      valueLength: 44,
      maskedValuePrefix: 'a'.repeat(4),
      maskedValueSuffix: 'a'.repeat(4),
    },
  },
]

const warnedRoutes = new Set<string>()

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2))
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length)
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function noContent(status = 204): Response {
  return new Response(null, { status })
}

function notFound(): Response {
  return json({ message: 'Not found' }, 404)
}

type MockRequest = { url: string; method: string }

const MOCK_TEAM_ID = 'mock-team-id'
const MOCK_USER_ID = 'aabbccdd-1122-4334-5566-7788990011aa'
const MOCK_TEAM_SLUG = 'mock-team'

export function mockFetch(request: MockRequest): Promise<Response> {
  const { pathname } = new URL(request.url)
  const method = request.method.toUpperCase()
  const key = `${method} ${pathname}`

  // infra-api routes
  if (method === 'GET' && pathname === '/api-keys') {
    return Promise.resolve(json(mockApiKeys))
  }

  if (method === 'POST' && pathname === '/api-keys') {
    const keyValue = `${API_KEY_PREFIX}${randomHex(40)}`
    const newKey = {
      id: crypto.randomUUID(),
      name: 'New Key',
      key: keyValue,
      createdAt: new Date().toISOString(),
      createdBy: null,
      lastUsed: null,
      mask: {
        prefix: API_KEY_PREFIX,
        valueLength: keyValue.length,
        maskedValuePrefix: keyValue.slice(
          API_KEY_PREFIX.length,
          API_KEY_PREFIX.length + 4
        ),
        maskedValueSuffix: keyValue.slice(-4),
      },
    }
    mockApiKeys.push(newKey)
    return Promise.resolve(json(newKey, 201))
  }

  if (method === 'DELETE' && /^\/api-keys\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop()
    const idx = mockApiKeys.findIndex((k) => k.id === id)
    if (idx !== -1) mockApiKeys.splice(idx, 1)
    return Promise.resolve(noContent(204))
  }

  if (method === 'PATCH' && /^\/api-keys\/[^/]+$/.test(pathname)) {
    return Promise.resolve(json({ success: true }))
  }

  // GET /sandboxes
  if (method === 'GET' && pathname === '/sandboxes') {
    return Promise.resolve(json([]))
  }

  // GET /sandboxes/metrics
  if (method === 'GET' && pathname === '/sandboxes/metrics') {
    return Promise.resolve(json({ sandboxes: {} }))
  }

  // GET /sandboxes/{id}
  if (method === 'GET' && /^\/sandboxes\/[^/]+$/.test(pathname)) {
    return Promise.resolve(notFound())
  }

  // GET /sandboxes/{id}/metrics
  if (method === 'GET' && /^\/sandboxes\/[^/]+\/metrics$/.test(pathname)) {
    return Promise.resolve(json([]))
  }

  // GET /v2/sandboxes/{id}/logs
  if (method === 'GET' && /^\/v2\/sandboxes\/[^/]+\/logs$/.test(pathname)) {
    return Promise.resolve(json({ logs: [], nextCursor: null }))
  }

  // GET /events/sandboxes/{id}
  if (method === 'GET' && /^\/events\/sandboxes\/[^/]+$/.test(pathname)) {
    return Promise.resolve(json([]))
  }

  // GET /templates
  if (method === 'GET' && pathname === '/templates') {
    return Promise.resolve(json([]))
  }

  // DELETE /templates/{id}
  if (method === 'DELETE' && /^\/templates\/[^/]+$/.test(pathname)) {
    return Promise.resolve(noContent(204))
  }

  // PATCH /v2/templates/{id}
  if (method === 'PATCH' && /^\/v2\/templates\/[^/]+$/.test(pathname)) {
    return Promise.resolve(json({ names: [] }))
  }

  // GET /teams/{teamID}/metrics
  if (method === 'GET' && /^\/teams\/[^/]+\/metrics$/.test(pathname)) {
    return Promise.resolve(json([]))
  }

  // GET /teams/{teamID}/metrics/max
  if (method === 'GET' && /^\/teams\/[^/]+\/metrics\/max$/.test(pathname)) {
    return Promise.resolve(json({ value: 0, timestampUnix: Math.floor(Date.now() / 1000), metric: 'concurrent_sandboxes' }))
  }

  // GET /templates/{templateID}/builds/{buildID}/status
  if (method === 'GET' && /^\/templates\/[^/]+\/builds\/[^/]+\/status$/.test(pathname)) {
    return Promise.resolve(json({ status: 'success', logs: [], envdVersion: '0.1.0' }))
  }

  // GET /templates/{templateID}/builds/{buildID}/logs
  if (method === 'GET' && /^\/templates\/[^/]+\/builds\/[^/]+\/logs$/.test(pathname)) {
    return Promise.resolve(json({ logs: [], isFinished: true }))
  }

  // dashboard-api routes

  // GET /teams
  if (method === 'GET' && pathname === '/teams') {
    return Promise.resolve(
      json({
        teams: [
          {
            id: MOCK_TEAM_ID,
            name: 'Mock Team',
            slug: MOCK_TEAM_SLUG,
            tier: 'hobby',
            email: 'mock@example.com',
            profilePictureUrl: null,
            isBlocked: false,
            isBanned: false,
            blockedReason: null,
            isDefault: true,
            createdAt: '2024-01-01T00:00:00Z',
            limits: {
              maxLengthHours: 24,
              concurrentSandboxes: 10,
              concurrentTemplateBuilds: 2,
              maxVcpu: 4,
              maxRamMb: 8192,
              diskMb: 10240,
            },
          },
        ],
      })
    )
  }

  // POST /teams
  if (method === 'POST' && pathname === '/teams') {
    return Promise.resolve(json({ id: crypto.randomUUID(), slug: 'new-team' }))
  }

  // GET /teams/resolve
  if (method === 'GET' && pathname === '/teams/resolve') {
    return Promise.resolve(json({ id: MOCK_TEAM_ID, slug: MOCK_TEAM_SLUG }))
  }

  // GET /teams/{teamID}/members
  if (method === 'GET' && /^\/teams\/[^/]+\/members$/.test(pathname)) {
    return Promise.resolve(
      json({
        members: [
          {
            id: MOCK_USER_ID,
            email: 'mock@example.com',
            isDefault: true,
            addedBy: null,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      })
    )
  }

  // POST /teams/{teamID}/members
  if (method === 'POST' && /^\/teams\/[^/]+\/members$/.test(pathname)) {
    return Promise.resolve(new Response(null, { status: 201 }))
  }

  // DELETE /teams/{teamID}/members/{userId}
  if (method === 'DELETE' && /^\/teams\/[^/]+\/members\/[^/]+$/.test(pathname)) {
    return Promise.resolve(noContent(204))
  }

  // PATCH /teams/{teamID}
  if (method === 'PATCH' && /^\/teams\/[^/]+$/.test(pathname)) {
    return Promise.resolve(json({ id: MOCK_TEAM_ID, name: 'Mock Team', profilePictureUrl: null }))
  }

  // GET /builds
  if (method === 'GET' && pathname === '/builds') {
    return Promise.resolve(json({ data: [], nextCursor: null }))
  }

  // GET /builds/statuses
  if (method === 'GET' && pathname === '/builds/statuses') {
    return Promise.resolve(json({ buildStatuses: [] }))
  }

  // GET /builds/{build_id}
  if (method === 'GET' && /^\/builds\/[^/]+$/.test(pathname)) {
    return Promise.resolve(notFound())
  }

  // GET /sandboxes/{id}/record
  if (method === 'GET' && /^\/sandboxes\/[^/]+\/record$/.test(pathname)) {
    return Promise.resolve(notFound())
  }

  // GET /templates/defaults
  if (method === 'GET' && pathname === '/templates/defaults') {
    return Promise.resolve(json({ templates: [] }))
  }

  // admin bootstrap
  if (method === 'POST' && /^\/admin\/users\/[^/]+\/bootstrap$/.test(pathname)) {
    return Promise.resolve(json({ id: MOCK_TEAM_ID, slug: MOCK_TEAM_SLUG }))
  }

  // unmatched — warn once, return safe default
  if (!warnedRoutes.has(key)) {
    warnedRoutes.add(key)
    console.warn(`[mock-fetch] unmatched route: ${key} — returning empty default`)
  }

  const isCollectionPath = !pathname.split('/').pop()?.includes('-') && !pathname.split('/').pop()?.match(/^[0-9a-f-]{36}$/)
  return Promise.resolve(json(isCollectionPath ? [] : {}))
}
