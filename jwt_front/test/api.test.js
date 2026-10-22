import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, request } from '../src/lib/api.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('login sends the exact backend DTO without cookies or an authorization header', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/auth/login')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'omit')
    assert.deepEqual(JSON.parse(options.body), { username: 'user', password: 'example-password' })
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.equal(options.headers.Authorization, undefined)
    return Response.json({ token: 'test-token', roles: ['ROLE_USER'] })
  }
  const response = await request('/api/auth/login', { method: 'POST', body: { username: 'user', password: 'example-password' } })
  assert.equal(response.token, 'test-token')
})

test('protected requests attach the bearer token without putting it in the URL', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/user/me')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.body, undefined)
    return Response.json({ id: 2, username: 'user', roles: ['ROLE_USER'] })
  }
  assert.equal((await request('/api/user/me', { token: 'test-token' })).username, 'user')
})

test('registration errors preserve backend field validation', async () => {
  globalThis.fetch = async () => Response.json({ error: 'Validation failed', fields: { password: 'size must be between 8 and 72' } }, { status: 400 })
  await assert.rejects(request('/api/auth/register', { method: 'POST', body: {} }), error => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 400)
    assert.equal(error.fields.password, 'size must be between 8 and 72')
    return true
  })
})

test('HTTP 401 and 403 retain distinct statuses for session and access handling', async () => {
  for (const status of [401, 403]) {
    globalThis.fetch = async () => Response.json({ error: 'Access rejected' }, { status })
    await assert.rejects(request('/api/user/me'), error => error instanceof ApiError && error.status === status)
  }
})

test('duplicate username errors are displayed from the backend', async () => {
  globalThis.fetch = async () => Response.json({ error: "Username 'user' is already taken" }, { status: 409 })
  await assert.rejects(request('/api/auth/register'), /already taken/)
})

test('offline and malformed proxy responses become readable errors', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed') }
  await assert.rejects(request('/api/public/hello'), error => error.status === 0 && /Cannot reach/.test(error.message))
  globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 502 })
  await assert.rejects(request('/api/public/hello'), error => error.status === 502 && /unexpected response/.test(error.message))
})

test('aborting a request stays silent instead of becoming a connectivity error', async () => {
  const controller = new AbortController()
  controller.abort()
  globalThis.fetch = async (_url, { signal }) => { throw signal.reason }
  await assert.rejects(request('/api/public/hello', { signal: controller.signal }), error => error.name === 'AbortError')
})
