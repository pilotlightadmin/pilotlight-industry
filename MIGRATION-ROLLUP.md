# Pilot Light — Build Step Migration & Security Rollup

## Why This Migration Is Needed

### Security (Critical)
- The Airtable API key is currently exposed in client-side code — anyone can view source and access the full database (voter emails, names, locations, votes, NDA signatures)
- No server-side validation — votes, accounts, and NDA signatures can be forged by calling the Airtable API directly
- Voter authentication happens client-side, meaning credentials are vulnerable

### Performance
- Babel compiles JSX in the browser on every page load (adds 1-3 seconds)
- All pilots + voters fetched from Airtable on every visit with no caching
- Entire app is a single 10,000+ line file parsed at once
- External dependencies (React, Babel, Lucide, Mux) load sequentially

### Maintainability
- Single `index.html` file with all components, logic, and styles
- No type checking, no linting, no automated tests
- Adding features means editing one massive file

---

## Migration Plan

### Phase 1: Project Setup (Vite + React) — ✅ COMPLETE

**Completed:** February 2026

**What changed:** The monolithic `index.html` was split into 40+ modular React files compiled ahead of time by Vite.

**Final project structure:**
```
pilot-light/
├── src/
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Root component with routing
│   ├── index.css                   # Global styles
│   ├── config.js                   # App configuration
│   ├── components/
│   │   ├── VideoModal.jsx          # Pilot video viewer + voting
│   │   ├── PilotCard.jsx           # Browse page pilot cards
│   │   ├── PilotCardCreator.jsx    # Creator portal pilot cards
│   │   ├── VoterNdaModal.jsx       # NDA signing modal
│   │   ├── ConfirmModal.jsx        # Generic confirmation dialog
│   │   ├── Icons.jsx               # Shared icon components
│   │   ├── UploadWizard.jsx        # Script upload wizard
│   │   └── ...
│   ├── pages/
│   │   ├── BrowsePage.jsx          # Main browse/voting page
│   │   ├── CreatorPortal.jsx       # Creator dashboard
│   │   ├── CreatorsLandingPage.jsx # Creator signup landing
│   │   ├── GenreLandingPage.jsx    # Genre-filtered browse
│   │   ├── LoginModal.jsx          # Login/signup modal
│   │   └── ...
│   ├── services/
│   │   ├── StorageManager.js       # All API calls (now via serverless)
│   │   └── airtableFetch.js        # Deprecated safety stub
│   └── utils/
│       ├── helpers.js              # Shared utilities
│       ├── badgeDefinitions.js     # Badge system data
│       └── constants.js            # App constants
├── netlify/
│   └── functions/                  # Serverless API (Phase 2)
├── netlify.toml                    # Netlify build + function config
├── vite.config.js                  # Vite build config
├── package.json
└── index.html                      # Vite entry HTML
```

**Build settings:**
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

---

### Phase 2: Serverless API Layer (Security Fix) — ✅ COMPLETE

**Completed:** February 27, 2026

**What changed:** All Airtable API calls moved from client-side JavaScript to Netlify serverless functions. The Airtable API key is no longer in any client-side code. Authentication uses simple session tokens stored on each voter's Airtable record.

#### Authentication System
- On login/signup, a random 64-character hex token is generated (`crypto.randomBytes(32)`)
- Token is stored on the voter's Airtable record in a `sessionToken` field
- Frontend stores token in `localStorage` as `pilotLightSessionToken`
- Authenticated requests send `Authorization: Bearer <token>` header
- Each serverless function that requires auth looks up the token in Airtable to verify identity

#### Serverless Functions Created

All functions are in `netlify/functions/` and use ESM syntax.

**Shared utilities:**
| File | Purpose |
|------|---------|
| `utils/airtable.js` | Shared Airtable helper — reads credentials from `process.env`, exports CRUD operations with pagination, CORS headers, and response helpers |
| `utils/auth.js` | Token auth — `generateToken()` and `authenticate(event)` that verifies Bearer tokens against Voters table |

**API endpoints:**
| Function | Method | Auth? | Purpose |
|----------|--------|-------|---------|
| `api-auth-login.js` | POST | No | Login with username/email + password, returns session token |
| `api-auth-signup.js` | POST | No | Create account, returns session token |
| `api-forgot-password.js` | POST | No | Generate password reset token (1-hour expiry) |
| `api-reset-password.js` | POST | No | Reset password using token, enforces no-repeat-of-last-3 |
| `api-get-pilots.js` | GET | No | Fetch all pilots (filters hidden), optional `?userId=X` for creator's pilots |
| `api-get-votes.js` | GET | Yes | Fetch votes, optional `?voterId=X` and `?pilotId=X` filters |
| `api-submit-vote.js` | POST | Yes | Create or update a vote (upsert by voter+pilot combo) |
| `api-get-pilot-stats.js` | GET | No | Aggregated vote stats for all pilots |
| `api-save-pilot.js` | POST | Yes | Create a new pilot (forces creatorUserId to match auth) |
| `api-update-pilot.js` | POST | Yes | Update pilot fields, supports `action: 'incrementFunding'` |
| `api-update-profile.js` | POST | Yes | Update voter profile (picture, displayName, aboutMe) |
| `api-delete-account.js` | POST | Yes | Soft delete (sets `deleted: true`, clears session) |
| `api-submit-creator-app.js` | POST | Yes | Submit creator application |
| `api-sign-nda.js` | POST | Yes | Sign NDA for a pilot, appends to pilot's ndaSigners |
| `api-admin.js` | POST | Yes (admin) | Multi-action admin endpoint (approve/reject creators, delete records, etc.) |

#### StorageManager Rewrite

`src/services/StorageManager.js` was completely rewritten. All ~30 methods now call serverless functions via a shared `apiFetch` helper:

```javascript
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('pilotLightSessionToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`/.netlify/functions/${endpoint}`, { ...options, headers });
  const text = await resp.text();
  try { return JSON.parse(text); } catch (e) { throw new Error('Unexpected server response'); }
};
```

#### Security Verification
- `npm run build` succeeds
- `grep -r "patK2Gy4" dist/` returns zero matches — API key is not in any client-side code
- All Airtable calls go through `/.netlify/functions/api-*` endpoints (verified in browser Network tab)
- `src/config.js` no longer contains `AIRTABLE_CONFIG`
- `src/services/airtableFetch.js` is a safety stub that throws if accidentally called

#### Airtable Schema Change
- Added `sessionToken` field (single line text) to the **Voters** table

#### UI Fixes Made During Phase 2
- **LoginModal import in VideoModal**: Was missing, causing login from video cards to fail
- **LoginModal render in BrowsePage**: State was set but component was never rendered in JSX
- **Video modal scrolling**: Drag handler was on entire modal (intercepting scroll). Moved to header only. Added `overscrollBehavior: 'contain'` and body scroll lock (`position: fixed` technique)
- **Video modal sizing**: Changed to `height: calc(100vh - 80px)` with fixed `y: 40` positioning
- **Sign Up buttons**: Added to BrowsePage nav and CreatorsLandingPage nav
- **Stale session handling**: App.jsx now detects pre-migration localStorage data (voter cached but no session token) and clears it gracefully
- **Creator guide text**: Updated "5-15 minutes" to "60-90 seconds", changed "pilot" to "pilot teaser" with clarifying language about acceptable formats

---

### Phase 3: Performance Optimizations — NOT STARTED

**Steps:**
1. Add a caching layer — cache pilot data in localStorage with a 2-minute TTL so repeat visits are instant
2. Lazy load Mux Player — only load when a user opens a video, not on page load
3. Code splitting — Vite automatically splits bundles so users only download what they need for the current page
4. Add loading skeletons so the page feels fast while data loads
5. Consider adding a service worker for offline capability

---

## Airtable Fields Reference

These are the current Airtable fields the app depends on. Ensure they all exist in the correct tables.

### Pilots Table
| Field | Type | Purpose |
|-------|------|---------|
| pilotTitle | Single line text | Pilot name |
| logline | Long text | Pilot description |
| genre | Single line text | Comedy, Drama, etc. |
| playbackId | Single line text | Mux video ID |
| creatorName | Single line text | Creator's display name |
| creatorUserId | Single line text | Links to Voters table |
| fundingUrl | URL | Crowdfunding link |
| fundingInterest | Number | Count of fund button clicks |
| ndaRequired | Checkbox | Creator toggle for NDA |
| ndaSigners | Long text | Log of NDA signers (name, email, date) |
| version | Number | Resubmission version |
| previousVersionId | Single line text | Links to previous version |
| hidden | Checkbox | Hides superseded pilots |
| voteCount | Number (rollup) | Total votes received |
| avgOverall | Number (rollup) | Average overall score |
| avgCuriosity | Number (rollup) | Average curiosity score |
| avgSeriesPotential | Number (rollup) | Average series potential score |

### Voters Table
| Field | Type | Purpose |
|-------|------|---------|
| name | Single line text | Username |
| email | Email | Account email |
| password | Single line text | Account password (⚠️ plain text — needs hashing post-migration) |
| sessionToken | Single line text | **NEW** — Auth session token (Phase 2) |
| displayName | Single line text | Optional display name |
| profilePicture | URL | Profile image |
| aboutMe | Long text | Creator bio |
| isCreator | Checkbox | Creator access flag |
| creatorStatus | Single line text | pending/approved/rejected/revoked |
| creatorApplication | Long text | JSON application data |
| ndaSigned | Checkbox | Whether user has signed any NDA |
| ndaSignedAt | Single line text | ISO timestamp of last NDA |
| gender | Single line text | User's gender |
| location | Single line text | User's location (City, State, Country) |
| deleted | Checkbox | Soft-delete flag |
| deletedAt | Single line text | ISO timestamp of deletion |
| passwordHistory | Long text | JSON array of last 3 passwords |
| resetToken | Single line text | Password reset token |
| resetExpiry | Single line text | Reset token expiry timestamp |

### Votes Table
| Field | Type | Purpose |
|-------|------|---------|
| pilotId | Link to Pilots | Links to pilot |
| voterId | Link to Voters | Links to voter |
| overallScore | Number | 1-5 star rating |
| curiosityScore | Number | 1-5 curiosity rating |
| seriesScore | Number | 1-5 series potential rating |
| pullFactorsIn | Long text | JSON — what drew them in |
| pullFactorsBack | Long text | JSON — what would bring them back |

---

## Environment Variables

Set in **Netlify → Site Settings → Environment Variables** (already configured):

| Variable | Purpose |
|----------|---------|
| `AIRTABLE_API_KEY` | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Airtable base ID |
| `MUX_TOKEN_ID` | Mux video token ID |
| `MUX_TOKEN_SECRET` | Mux video token secret |

Local development uses `.env` file in project root (same variables, already set up).

---

## Development Workflow

### Running locally
```bash
cd ~/Desktop/pilot-light
netlify dev
# Opens http://localhost:8888 (NOT port 3000)
# Port 8888 = Netlify CLI proxy (routes /.netlify/functions/* to local functions)
# Port 3000 = Raw Vite dev server (API calls will fail here)
```

### Making changes
1. Edit files in `src/` (frontend) or `netlify/functions/` (backend)
2. Vite hot-reloads frontend changes automatically
3. Netlify CLI hot-reloads function changes automatically
4. Test on `localhost:8888`

### Deploying
```bash
cd ~/Desktop/pilot-light
git add src/ netlify/ netlify.toml package.json package-lock.json index.html vite.config.js .gitignore
git commit -m "Description of changes"
git push
# Netlify auto-deploys from git push
```

### Starting a new AI chat session
Point the new session to read this file (`MIGRATION-ROLLUP.md`) for full project context before making changes.

---

## Estimated Effort

| Phase | Time | Priority | Status |
|-------|------|----------|--------|
| Phase 1: Vite setup + file splitting | 3-5 hours | Medium | ✅ Complete |
| Phase 2: Serverless API + auth | 5-8 hours | **High (security)** | ✅ Complete |
| Phase 3: Performance optimizations | 2-3 hours | Low | Not started |

---

## What Stays the Same

- Your Netlify hosting and domain
- Your Airtable database (no data migration needed)
- Your git push → auto-deploy workflow
- The entire user experience — voters and creators see zero changes
- All existing features (badges, funding, NDA, voting, etc.)

## Known Issues / Future Work

- **Password hashing**: Passwords are still stored as plain text in Airtable. Should hash with bcrypt in `api-auth-signup.js` and `api-auth-login.js`.
- **Rate limiting**: No rate limiting on serverless functions yet. Could add via Netlify or custom middleware.
- **Vote caching**: Pilot data is fetched fresh every page load. Phase 3 will add client-side caching.
- **Password reset email**: `api-forgot-password.js` generates a reset token but doesn't send an email yet — needs integration with an email service (Brevo/SendGrid).
