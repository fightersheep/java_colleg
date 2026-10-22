import { useEffect, useRef, useState } from 'react'
import { ApiError, request } from './lib/api.js'
import { createSession, readSession, storeSession } from './lib/session.js'
import './App.css'

function Icon({ name, size = 20, ...props }) {
  const paths = {
    shield: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5" /></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    logout: <><path d="M9 4H4v16h5m5-12 4 4-4 4m-5-4h12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    key: <><circle cx="8" cy="9" r="5" /><path d="m12 13 8 8m-4-4 3-3m-6 0 3-3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}

const resources = [
  { id: 'public', title: 'Public resource', description: 'An open endpoint. Everyone is welcome.', path: '/api/public/hello', icon: 'globe', access: 'Public', action: 'Test connection' },
  { id: 'profile', title: 'My profile', description: 'Your account, verified by the backend.', path: '/api/user/me', icon: 'user', access: 'User', action: 'Load my profile', role: 'ROLE_USER' },
  { id: 'users', title: 'User directory', description: 'All registered accounts in one place.', path: '/api/admin/users', icon: 'users', access: 'Admin', action: 'View users', role: 'ROLE_ADMIN' },
]

function RoleBadges({ roles = [] }) {
  return <span className="role-list">{roles.map(role => <span key={role} className={`badge ${role === 'ROLE_ADMIN' ? 'badge-admin' : 'badge-user'}`}>{role.replace('ROLE_', '').toLowerCase()}</span>)}</span>
}

function AuthForm({ onLogin, notice }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const [success, setSuccess] = useState('')
  const registering = mode === 'register'

  function switchMode(next) {
    setMode(next)
    setError('')
    setFields({})
    setSuccess('')
    setPassword('')
    setConfirm('')
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setFields({})
    setSuccess('')
    if (registering && password !== confirm) {
      setFields({ confirm: 'Passwords do not match.' })
      return
    }
    if (registering && new TextEncoder().encode(password).length > 72) {
      setFields({ password: 'Password must be at most 72 bytes.' })
      return
    }
    setBusy(true)
    try {
      const data = await request(`/api/auth/${registering ? 'register' : 'login'}`, { method: 'POST', body: { username: username.trim(), password } })
      if (registering) {
        setMode('login')
        setPassword('')
        setConfirm('')
        setSuccess('Account created. Sign in with your new credentials.')
      } else {
        onLogin(createSession(data))
      }
    } catch (err) {
      setError(err.message)
      setFields(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel auth-panel">
    <div className="panel-heading"><span className="icon-box"><Icon name="key" /></span><span className="eyebrow">YOUR ACCOUNT</span></div>
    <h2>{registering ? 'Make yourself at home.' : 'Welcome back.'}</h2>
    <p className="muted">{registering ? 'Create an account to access your workspace.' : 'Sign in to unlock your personal workspace.'}</p>
    <div className="auth-tabs" aria-label="Account action">
      <button type="button" className={!registering ? 'selected' : ''} onClick={() => switchMode('login')} disabled={busy} aria-pressed={!registering}>Sign in</button>
      <button type="button" className={registering ? 'selected' : ''} onClick={() => switchMode('register')} disabled={busy} aria-pressed={registering}>Create account</button>
    </div>
    <form onSubmit={submit}>
      {(error || notice) && <div className="message error" role="alert">{error || notice}</div>}
      {success && <div className="message success" role="status">{success}</div>}
      <label htmlFor="username">Username</label>
      <input id="username" name="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" required minLength={registering ? 3 : undefined} maxLength={registering ? 50 : undefined} disabled={busy} aria-invalid={!!fields.username} aria-describedby={fields.username ? 'username-error' : undefined} />
      {fields.username && <p className="field-error" id="username-error">{fields.username}</p>}
      <div className="label-row"><label htmlFor="password">Password</label>{registering && <span>8–72 characters</span>}</div>
      <div className="password-input"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={registering ? 'Create a strong password' : 'Enter your password'} required minLength={registering ? 8 : undefined} maxLength={registering ? 72 : undefined} disabled={busy} aria-invalid={!!fields.password} aria-describedby={fields.password ? 'password-error' : undefined} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}><Icon name="eye" size={18} /></button></div>
      {fields.password && <p className="field-error" id="password-error">{fields.password}</p>}
      {registering && <><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Enter your password again" required disabled={busy} aria-invalid={!!fields.confirm} aria-describedby={fields.confirm ? 'confirm-error' : undefined} />{fields.confirm && <p className="field-error" id="confirm-error">{fields.confirm}</p>}</>}
      <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in to workspace'}{!busy && <Icon name="arrow" size={18} />}</button>
    </form>
    <p className="secure-note"><Icon name="lock" size={14} /> Your session stays in this browser tab.</p>
    {!registering && <details className="demo-details"><summary>Trying the classroom accounts?</summary><p>Use a default account if its password has not been changed.</p><div className="demo-buttons"><button type="button" disabled={busy} onClick={() => { setUsername('user'); setPassword('User123!') }}>Fill user credentials</button><button type="button" disabled={busy} onClick={() => { setUsername('admin'); setPassword('Admin123!') }}>Fill admin credentials</button></div></details>}
  </section>
}

function App() {
  const [session, setSession] = useState(readSession)
  const [now, setNow] = useState(Date.now)
  const [view, setView] = useState('overview')
  const [connection, setConnection] = useState('checking')
  const [notice, setNotice] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const [activity, setActivity] = useState([])
  const sessionRef = useRef(session)
  const pending = useRef(new Set())
  const isAdmin = session?.roles.includes('ROLE_ADMIN')

  function changeSession(next, message = '') {
    sessionRef.current = next
    storeSession(next)
    setSession(next)
    setNotice(message)
    setResults({})
    setLoading({})
    setActivity([])
    setView('overview')
  }

  useEffect(() => {
    const controller = new AbortController()
    request('/api/public/hello', { signal: controller.signal })
      .then(() => setConnection('online'))
      .catch(err => { if (err.name !== 'AbortError') setConnection('offline') })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!session) return
    const timeout = setTimeout(() => changeSession(null, 'Your session has expired. Please sign in again.'), Math.min(Math.max(0, session.expiresAt - Date.now()), 2_147_483_647))
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [session])

  async function loadResource(resource) {
    const currentSession = sessionRef.current
    const key = `${resource.id}:${currentSession?.token || 'guest'}`
    if (pending.current.has(key)) return
    pending.current.add(key)
    setLoading(previous => ({ ...previous, [resource.id]: true }))
    try {
      const data = await request(resource.path, { token: resource.role ? currentSession?.token : undefined })
      if (sessionRef.current !== currentSession) return
      setConnection('online')
      setResults(previous => ({ ...previous, [resource.id]: { data } }))
      setActivity(previous => [{ id: crypto.randomUUID(), title: resource.title, ok: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...previous].slice(0, 5))
      if (resource.id === 'profile') setView('profile')
      if (resource.id === 'users') setView('users')
    } catch (err) {
      if (sessionRef.current !== currentSession) return
      if (err instanceof ApiError && err.status === 401 && resource.role) {
        changeSession(null, 'Your session is no longer valid. Please sign in again.')
        return
      }
      if (!err.status || err.status >= 500) setConnection('offline')
      setResults(previous => ({ ...previous, [resource.id]: { error: err.message } }))
      setActivity(previous => [{ id: crypto.randomUUID(), title: resource.title, ok: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...previous].slice(0, 5))
    } finally {
      pending.current.delete(key)
      if (sessionRef.current === currentSession) setLoading(previous => ({ ...previous, [resource.id]: false }))
    }
  }

  const minutesLeft = session ? Math.max(0, Math.ceil((session.expiresAt - now) / 60000)) : 0
  const profile = results.profile?.data
  const users = results.users?.data

  function navigate(next) {
    setView(next)
    if (next === 'profile') loadResource(resources[1])
    if (next === 'users') loadResource(resources[2])
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setView('overview') }} aria-label="JWT workspace home"><span className="brand-symbol"><Icon name="shield" size={24} /></span><span>jwt<span className="brand-dot">.</span><small>WORKSPACE</small></span></a>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={view === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setView('overview')} aria-current={view === 'overview' ? 'page' : undefined}><Icon name="grid" />Overview<span className="nav-dot" /></button>
        <button className={view === 'profile' ? 'nav-item active' : 'nav-item'} disabled={!session?.roles.includes('ROLE_USER')} onClick={() => navigate('profile')} aria-current={view === 'profile' ? 'page' : undefined}><Icon name="user" />My profile{!session && <Icon name="lock" size={14} />}</button>
        <button className={view === 'users' ? 'nav-item active' : 'nav-item'} disabled={!isAdmin} onClick={() => navigate('users')} aria-current={view === 'users' ? 'page' : undefined}><Icon name="users" />User directory{!isAdmin && <Icon name="lock" size={14} />}</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><Icon name="shield" size={23} /><strong>A little token.<br />The right access.</strong><p>One workspace. Access that follows your role.</p><span>POWERED BY JWT <span>↗</span></span></div><div className="sidebar-account"><span className="avatar">{session ? session.username.slice(0, 2).toUpperCase() : <Icon name="user" size={18} />}</span><div><strong>{session?.username || 'Guest session'}</strong><small>{session ? 'Signed in' : 'Sign in to get started'}</small></div>{session && <button className="icon-button" title="Sign out" aria-label="Sign out" onClick={() => changeSession(null)}><Icon name="logout" size={18} /></button>}</div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{view === 'profile' ? 'My profile' : view === 'users' ? 'User directory' : 'Overview'}</strong></div><span className={`connection ${connection}`} role="status"><i />{connection === 'checking' ? 'Connecting…' : connection === 'online' ? 'Backend connected' : 'Backend unavailable'}</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">YOUR ACCESS, SIMPLIFIED</div><h1>{view === 'profile' ? 'My profile' : view === 'users' ? 'User directory' : 'Workspace overview'}<span>.</span></h1><p>{view === 'profile' ? 'A closer look at your account and permissions.' : view === 'users' ? 'The people who make up your workspace.' : session ? `Good to see you, ${session.username}. Your workspace is ready.` : 'A secure starting point for everything you have access to.'}</p></div><span className="environment"><span />LOCAL WORKSPACE</span></div>

        <section className="summary-grid" aria-label="Workspace status">
          <div className="summary-card"><span className="summary-icon"><Icon name="shield" /></span><div><span>Authentication</span><strong>{session ? 'Signed in' : 'Not signed in'}</strong></div><span className={`small-dot ${session ? 'green' : ''}`} /></div>
          <div className="summary-card"><span className="summary-icon"><Icon name="key" /></span><div><span>Your access</span><strong>{session ? isAdmin ? 'Administrator' : 'Member' : 'Public access'}</strong></div></div>
          <div className="summary-card"><span className="summary-icon"><Icon name="clock" /></span><div><span>Session expires in</span><strong>{session ? `${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'}` : 'No active session'}</strong></div></div>
        </section>

        {view === 'overview' && <div className={`workspace-grid ${session ? 'authenticated' : ''}`}>
          {session ? <section className="panel welcome-panel"><div className="panel-heading"><span className="icon-box"><Icon name="check" /></span><span className="eyebrow">YOU’RE ALL SET</span></div><h2>Your workspace.<br />Your permissions.</h2><p className="muted">You’re securely signed in as <strong>{session.username}</strong>. Explore the resources available to your account.</p><RoleBadges roles={session.roles} /><div className="session-detail"><Icon name="lock" size={16} /><span>JWT session active</span><span className="small-dot green" /></div><button className="secondary-button" onClick={() => changeSession(null)}><Icon name="logout" size={17} />Sign out</button></section> : <AuthForm onLogin={next => { setNow(Date.now()); changeSession(next) }} notice={notice} />}
          <section className="resources-section"><div className="section-heading"><div><h2>Explore your resources</h2><p>Three levels of access. One connected workspace.</p></div><span className="count-label">03</span></div>
            <div className="resource-list">{resources.map(resource => {
              const allowed = !resource.role || session?.roles.includes(resource.role)
              const result = results[resource.id]
              return <article className={`resource-card ${!allowed ? 'resource-locked' : ''}`} key={resource.id}><div className="resource-top"><span className={`resource-icon ${resource.id}`}><Icon name={resource.icon} size={22} /></span><span className={`badge badge-${resource.id}`}>{resource.access}</span></div><h3>{resource.title}</h3><p>{resource.description}</p><div className="resource-footer"><code><span>GET</span> {resource.path}</code><button onClick={() => loadResource(resource)} disabled={!allowed || loading[resource.id]} aria-label={allowed ? resource.action : `${resource.title}: ${session ? `${resource.access} role required` : 'sign in required'}`}>{loading[resource.id] ? 'Loading…' : allowed ? resource.action : session ? 'Admin access required' : 'Sign in to unlock'}<Icon name={allowed ? 'arrow' : 'lock'} size={15} /></button></div>{result?.error && <div className="message error" role="alert">{result.error}</div>}{resource.id === 'public' && result?.data && <div className="message success" role="status"><Icon name="check" size={16} />{result.data.message}</div>}</article>
            })}</div>
          </section>
        </div>}

        {view === 'profile' && <section className="panel data-panel"><div className="section-heading"><div><h2>Account details</h2><p>Returned by your authenticated profile endpoint.</p></div><button className="secondary-button compact" disabled={loading.profile} onClick={() => loadResource(resources[1])}><Icon name="refresh" size={16} />Refresh</button></div>{loading.profile && <p role="status" className="muted">Loading your profile…</p>}{results.profile?.error && <div className="message error" role="alert">{results.profile.error}</div>}{profile && <><div className="profile-identity"><span className="avatar large">{profile.username.slice(0, 2).toUpperCase()}</span><div><h2>{profile.username}</h2><RoleBadges roles={profile.roles} /></div></div><dl className="profile-details"><div><dt>User ID</dt><dd>#{profile.id}</dd></div><div><dt>Username</dt><dd>{profile.username}</dd></div><div><dt>Account status</dt><dd><span className={`badge ${profile.enabled ? 'badge-user' : ''}`}>{profile.enabled ? 'Enabled' : 'Disabled'}</span></dd></div><div><dt>Permissions</dt><dd><RoleBadges roles={profile.roles} /></dd></div></dl></>}</section>}

        {view === 'users' && isAdmin && <section className="panel data-panel"><div className="section-heading"><div><h2>Registered users {Array.isArray(users) && <span className="badge">{users.length}</span>}</h2><p>Account visibility for administrators.</p></div><button className="secondary-button compact" disabled={loading.users} onClick={() => loadResource(resources[2])}><Icon name="refresh" size={16} />Refresh</button></div>{loading.users && <p className="muted" role="status">Loading users…</p>}{results.users?.error && <div className="message error" role="alert">{results.users.error}</div>}{Array.isArray(users) && <div className="table-wrapper"><table><thead><tr><th scope="col">User</th><th scope="col">ID</th><th scope="col">Roles</th><th scope="col">Status</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><div className="table-user"><span className="avatar">{user.username.slice(0, 2).toUpperCase()}</span><strong>{user.username}</strong>{user.username === session.username && <span className="you-label">you</span>}</div></td><td className="mono">#{user.id}</td><td><RoleBadges roles={user.roles} /></td><td><span className={`account-status ${user.enabled ? 'enabled' : ''}`}><i />{user.enabled ? 'Enabled' : 'Disabled'}</span></td></tr>)}</tbody></table>{users.length === 0 && <p className="empty-state">No accounts found.</p>}</div>}</section>}

        <section className="activity-section"><div className="section-heading"><h2>Recent activity</h2><span className="subtle-label">THIS SESSION</span></div>{activity.length ? <ul className="activity-list">{activity.map(item => <li key={item.id}><span className={`activity-dot ${item.ok ? 'green' : 'red'}`} /><span>{item.title} <span className="muted">{item.ok ? 'loaded successfully' : 'request failed'}</span></span><time>{item.time}</time></li>)}</ul> : <div className="activity-empty"><span className="icon-box"><Icon name="clock" size={18} /></span><div><strong>A fresh start.</strong><p>Your resource requests will appear here.</p></div></div>}</section>
        <footer><span><Icon name="shield" size={15} /> JWT Workspace</span><span>Built on trust. Connected with tokens.</span><span className="footer-version">v1.0</span></footer>
      </main>
    </div>
  </div>
}

export default App
