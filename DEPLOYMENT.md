# Deploying to Vercel

This repo is one Vercel **project** with two **services** — one domain, one
build per service, routed by the top-level rewrites in `vercel.json`.

| Service   | Root       | Framework | Reachable at |
| --------- | ---------- | --------- | ------------ |
| `backend` | `backend/` | express   | `/api/*`     |
| `frontend`| `frontend/`| vite      | everything else |

Do not create two separate Vercel projects. The per-service `vercel.json` files
that used to sit in `backend/` and `frontend/` are gone on purpose: in services
mode build and runtime keys belong on the service in the root file, and a nested
`vercel.json` would be a second source of truth.

## Project settings

Set the **Root Directory** to the folder containing this `vercel.json` — that is
`zero-to-shipped/`, not the workspace root. Vercel looks for `vercel.json` there.

## Environment variables

Set these on the project (they are shared by both services, which is one reason
services mode is convenient here). Do not commit real values.

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/zero_to_shipped
LABD_API_KEY=<your key from learn.thedevlabs.io/settings#api-keys>
```

Optional:

```
CLIENT_ORIGIN=https://your-project.vercel.app,http://localhost:5173
VITE_API_URL=https://example.com/api
```

- `CLIENT_ORIGIN` only matters if something calls the API from a *different*
  origin. On the deployed site `/api/*` is same-origin, so CORS does not come
  into play. Leave it set anyway so local dev and any direct curl keep working.
- `VITE_API_URL` is an escape hatch for pointing the frontend at an API on
  another origin. Leave it unset to use the relative `/api`. Vite inlines it at
  **build** time, so changing it requires a redeploy of the frontend service.
- Do not set `PORT` — Vercel manages it.

## How the two services talk

They mostly don't. The browser calls `/api/analyze` on the same domain and the
rewrite routes it to the `backend` service. No service-to-service binding is
configured, because nothing server-side calls another service — the frontend's
call is a browser call, and a binding's internal URL only resolves inside
Vercel, so the browser could not use it anyway. If a server-side caller is added
later, declare a binding on the **calling** service:

```json
"bindings": [
  { "type": "service", "service": "backend", "format": "url", "env": "BACKEND_URL" }
]
```

and read it as `process.env.BACKEND_URL`. Vercel injects it; do not set it
yourself. Bindings resolve in functions only — not during builds, and not in
middleware.

## Atlas checklist (the usual reason production returns 500s)

- **Network Access:** serverless functions have no fixed IP, so an allow-list of
  just your home IP blocks them. Allow `0.0.0.0/0` while testing, or Vercel's
  egress ranges.
- **Database name in the URI:** `...mongodb.net/zero_to_shipped`. Without it,
  writes land in a database called `test`.
- **Use a scoped user**, not your Atlas admin login.

The app scores resumes even with no database connected — it just doesn't save
them.

## Testing locally

`vercel dev` runs all services together and injects the binding variables.
Or run the two halves by hand, which is often faster while iterating:

```bash
cd backend  && npm run dev    # http://localhost:5000
cd frontend && npm run dev    # http://localhost:5173, proxies /api to :5000
```
