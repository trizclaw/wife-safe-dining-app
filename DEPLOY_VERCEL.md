# Deploy to Vercel (Free Mode default)

## 1) Push repo to GitHub
```bash
cd /Users/trizclaw/.openclaw/workspace/wife-safe-dining-app
git init
git add .
git commit -m "Phase A+B wife-safe-dining-app"
# create empty repo on GitHub first, then:
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## 2) Import in Vercel
- Vercel Dashboard -> Add New Project -> Import GitHub repo
- Framework: Next.js (auto)

## 3) Environment variables
Set in Vercel Project Settings -> Environment Variables:
- Optional (enhanced mode): `GOOGLE_MAPS_API_KEY`
- Optional: `CACHE_TTL_MS=3600000`
- Optional tuning:
  - `FREE_PROVIDER_MIN_INTERVAL_MS=350`
  - `FREE_PROVIDER_MAX_RETRIES=2`
  - `FREE_PROVIDER_BACKOFF_MS=500`

If `GOOGLE_MAPS_API_KEY` is missing, app runs in **Free Mode** (OSM/Overpass).

## 4) Deploy
- Click Deploy
- Open generated `*.vercel.app` URL

## 5) iPhone test
- Open that `*.vercel.app` URL on iPhone (cellular or Wi-Fi)
- Accept location permission
- Verify mode badge shows **Free Mode** (unless Google key added)
