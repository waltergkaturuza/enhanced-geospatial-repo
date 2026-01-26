# Render Static Site Configuration

## Frontend Static Site Setup

The frontend is deployed as a **Static Site** on Render (separate from the backend).

### Manual Configuration Required in Render Dashboard:

1. Go to your **Frontend Static Site** (`zimgeo` or `enhanced-geospatial-repo-1`)
2. Click **Settings**
3. Under **Redirects/Rewrites**, add:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

### Or verify `_redirects` file:

The `_redirects` file in `frontend/public/` should contain:
```
/*  /index.html  200
```

This file gets copied to `dist/` during build and tells Render to serve `index.html` for all routes, enabling React Router to handle client-side routing.

### Verify Deployment Settings:

- **Root Directory**: Should be empty or `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist` (or `frontend/dist` if root is not set)

### Testing:

After configuration, all these routes should work:
- `/` (home)
- `/login`
- `/signup`
- `/dashboard`
- `/admin/*`
