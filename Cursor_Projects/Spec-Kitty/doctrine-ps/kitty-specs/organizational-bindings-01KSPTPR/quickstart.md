# Quickstart: Organisational Bindings

*How to run and use the dashboard with org bindings enabled.*

---

## Prerequisites

- Node.js 20 LTS installed
- Dashboard built: `tools/pack-dashboard/`
- Config directory initialised: `config/` at repo root (created as part of this feature)

---

## Running the dashboard

```bash
# From repo root
cd tools/pack-dashboard

# Install dependencies (first time only)
npm install

# Start the Express backend (port 3000)
npm run start:server

# In a second terminal — start the Angular dev server (port 4200)
npm start
```

Open [http://localhost:4200](http://localhost:4200) and navigate to **Organisational Bindings** in the sidebar.

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CONFIG_ROOT` | `<repo-root>/config` | Location of `domain-config.yaml`, `artifact-tags.yaml`, `org-bindings.yaml` |
| `PACK_ROOT` | `<repo-root>/pack` | Location of the doctrine pack (unchanged) |
| `DOCS_ROOT` | `<repo-root>/docs` | Location of documentation root (read-only, unchanged) |
| `PORT` | `3000` | Express server port |

To use a non-standard config directory:

```bash
CONFIG_ROOT=/custom/path npm run start:server
```

---

## First-time config initialisation

`config/org-bindings.yaml` is created automatically by the server on first POST if absent. To seed it manually:

```yaml
# config/org-bindings.yaml
schema_version: "1.0"
bindings: []
```

---

## Creating a binding via the UI

1. Navigate to **Organisational Bindings** (`/org-bindings`)
2. Click **+ New Binding**
3. Select a domain from the dropdown (populated from `config/domain-config.yaml`)
4. Fill in Department, SPOC (name or `@regnology.net` email), Accountability (R/A/C/I), and optional Involvement
5. Click **Save** — the binding appears immediately in the grid

---

## Orphaned bindings

If a domain is removed from `config/domain-config.yaml` while bindings still reference it, those bindings appear with a **danger banner**. You can:

- **Cascade delete**: removes all orphaned bindings for that domain
- **Rebind**: select a replacement domain and reassign

---

## Running tests

```bash
# Server unit tests (Vitest)
cd tools/pack-dashboard/server
npm test

# Frontend build check
cd tools/pack-dashboard
npm run build
```
