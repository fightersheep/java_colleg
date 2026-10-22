# JWT Workspace

React frontend for the existing Spring Boot backend. All application changes are confined to `jwt_front`.

## Run locally

Start the existing backend and its PostgreSQL database as usual. The backend defaults to `http://localhost:8080`.

From this directory:

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). On Windows with PowerShell script restrictions, use `npm.cmd` instead of `npm`.

The frontend sends relative `/api` requests. Vite proxies them to the backend, so no backend CORS changes are required. To use another backend address, create a `.env.local` file in this directory:

```dotenv
BACKEND_URL=http://localhost:8080
```

Restart Vite after changing this setting. `BACKEND_URL` is a server-side proxy setting and is not exposed in the browser bundle.

## Features

- Sign in and register, with client and backend validation errors.
- JWT session stored in `sessionStorage`, restored on reload in the same tab, and cleared on expiry, sign-out, or authenticated HTTP 401 responses.
- Public connectivity check, authenticated profile, and admin-only user directory.
- Access-aware navigation, request loading states, and recent resource activity.

New accounts receive the user role from the backend. Admin privileges cannot be requested at registration. The backend remains the authority for all permissions.

The sign-in form includes optional fill buttons for the backend's initial classroom accounts: `user` / `User123!` and `admin` / `Admin123!`. These work only if the default passwords have not been changed.

## API contract

| Action | Method | Endpoint |
| --- | --- | --- |
| Register | POST | `/api/auth/register` |
| Sign in | POST | `/api/auth/login` |
| Public resource | GET | `/api/public/hello` |
| My profile | GET | `/api/user/me` |
| User directory | GET | `/api/admin/users` |

Sign-in and registration send `{ "username": "...", "password": "..." }`. Protected requests send `Authorization: Bearer <token>`. Passwords are never persisted by the frontend.

## Checks and production build

```sh
npm run lint
npm test
npm run build
npm run preview
```

Preview also proxies `/api` to the backend. For production, serve `dist` using a web server configured to forward `/api` to Spring Boot on the same origin; the Vite proxy is not included in static build output.
