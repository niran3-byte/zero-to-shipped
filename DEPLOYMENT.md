# Vercel deployment env vars — set these in each Vercel project's dashboard.
# This file documents them; do not commit real secrets. `.env` is gitignored.

## Backend project  (Root Directory: zero-to-shipped/backend)

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/zero_to_shipped
CLIENT_ORIGIN=https://zero-to-shipped-frontend.vercel.app

  # CLIENT_ORIGIN accepts a comma-separated list, so a preview deploy and the
  # production URL can both be allowed:
  # CLIENT_ORIGIN=https://zero-to-shipped-frontend.vercel.app,https://zero-to-shipped-frontend-git-main-you.vercel.app
  #
  # Do not set PORT — Vercel manages it.

## Frontend project  (Root Directory: zero-to-shipped/frontend)

VITE_API_URL=https://zero-to-shipped-api.vercel.app/api

  # This is the backend project's URL with /api on the end. Vite inlines it at
  # build time, so after changing it you must redeploy the frontend.

## Atlas checklist (the usual reason production returns 500s)

- Network Access: allow 0.0.0.0/0 for testing, or Vercel's egress IPs.
  Serverless functions have no fixed IP, so an IP allow-list of just your home
  IP will block them.
- The database name must be in the URI: ...mongodb.net/zero_to_shipped
  Without it, writes go to a "test" database.
- Use a user scoped to that database, not your Atlas admin login.
