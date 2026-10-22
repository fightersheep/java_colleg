import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { createSession, readSession, storeSession } from '../src/lib/session.js'

const originalStorage = globalThis.sessionStorage
let entries
beforeEach(() => {
  entries = new Map()
  globalThis.sessionStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: key => entries.delete(key),
  }
})
afterEach(() => {
  if (originalStorage === undefined) delete globalThis.sessionStorage
  else globalThis.sessionStorage = originalStorage
})

const login = { token: 'test-token', tokenType: 'Bearer', expiresInMs: 3600000, username: 'user', roles: ['ROLE_USER'] }

test('session expires according to expiresInMs and never stores the password', () => {
  const session = createSession({ ...login, password: 'do-not-store' }, 1000)
  assert.equal(session.expiresAt, 3601000)
  assert.equal(session.password, undefined)
  assert.deepEqual(session.roles, ['ROLE_USER'])
})

test('reload restores an active session and logout removes it', () => {
  const session = createSession(login)
  storeSession(session)
  assert.deepEqual(readSession(), session)
  storeSession(null)
  assert.equal(readSession(), null)
  assert.equal(entries.size, 0)
})

test('expired, invalid, and corrupted saved sessions never sign in', () => {
  for (const value of ['{broken', JSON.stringify({ ...createSession(login), expiresAt: Date.now() - 1 }), JSON.stringify({ token: 'test', roles: [] })]) {
    entries.set('jwt-workspace.session', value)
    assert.equal(readSession(), null)
  }
})

test('blocked browser storage does not break sign-in or sign-out', () => {
  globalThis.sessionStorage = {
    getItem() { throw new Error('Blocked') },
    setItem() { throw new Error('Blocked') },
    removeItem() { throw new Error('Blocked') },
  }
  assert.equal(readSession(), null)
  assert.doesNotThrow(() => storeSession(createSession(login)))
  assert.doesNotThrow(() => storeSession(null))
})

test('malformed login responses cannot become authenticated sessions', () => {
  for (const response of [null, {}, { ...login, token: '' }, { ...login, roles: 'ADMIN' }, { ...login, roles: [null] }, { ...login, expiresInMs: 0 }]) {
    assert.throws(() => createSession(response), /invalid sign-in response/)
  }
})
