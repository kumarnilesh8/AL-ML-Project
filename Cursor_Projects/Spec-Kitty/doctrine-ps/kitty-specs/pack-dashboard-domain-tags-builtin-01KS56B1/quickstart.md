# Quickstart: Pack Dashboard — Domain Tags and Built-in Doctrine

**Mission**: pack-dashboard-domain-tags-builtin-01KS56B1

---

## Prerequisites

```bash
# From the repository root:
cd tools/pack-dashboard

# Install dependencies (if not already done)
npm install
cd server && npm install && cd ..

# Verify the built-in doctrine source is present
ls ../forks/spec-kitty/src/doctrine/
```

If the `forks/spec-kitty` directory is absent, the built-in scanner will log a warning
and return empty results — this is expected and handled gracefully (NFR-003).

---

## Running the Development Environment

```bash
# Terminal 1 — Express server (port 3000)
cd tools/pack-dashboard/server
npm run dev

# Terminal 2 — Angular dev server (port 4200)
cd tools/pack-dashboard
npm start
```

Open http://localhost:4200.

---

## Domain Tag Vocabulary

The allowed domain tags are defined in `docs/domain-config.yaml`. The starter set ships with
10 domains (engineering, security, communications, governance, devops, quality, architecture,
research, tooling, delivery).

To **add a new domain tag**, edit `docs/domain-config.yaml`:

```yaml
domains:
  - id: my-new-domain
    label: My New Domain
    description: What this domain covers.
    color: blue   # one of: blue, green, red, petrol, amber, purple
```

The server picks up the change on the next request (read-per-request, no restart needed).

---

## Artifact Tag Assignments

Artifact-to-domain mappings are stored in `docs/artifact-tags.yaml`:

```yaml
schema_version: "1"
tags:
  appsec-compliance:
    domains: [security, governance]
  regnology-branding:
    domains: [communications]
```

The dashboard's artifact detail page provides an editable UI for setting these. Manual
editing of the file is also fine — the server reads on every request.

---

## Verifying Built-in Artifacts

```bash
# List all built-in artifacts the server found at startup
curl http://localhost:3000/api/builtin | jq 'keys'

# Check a specific kind
curl http://localhost:3000/api/builtin/directives | jq '.[0]'

# If the list is empty but you expect built-ins:
echo $SPEC_KITTY_SRC
ls $SPEC_KITTY_SRC/doctrine/
```

---

## Running Tests

```bash
# Server tests (supertest integration)
cd tools/pack-dashboard/server
npm test

# Frontend unit tests
cd tools/pack-dashboard
npm test
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PACK_ROOT` | `<repo>/pack` | Path to the org doctrine pack |
| `SPEC_KITTY_SRC` | `<repo>/../forks/spec-kitty/src` | Path to spec-kitty source (built-in doctrine) |
| `PORT` | `3000` | Server port |
