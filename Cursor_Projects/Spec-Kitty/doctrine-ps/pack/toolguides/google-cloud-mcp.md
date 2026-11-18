<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Toolguide: Google Cloud MCP — SQLX Data Model Server

**Interface:** Cursor MCP (`data-model-definitions`)  
**Transport:** HTTP (`streamable-http` via Cloud Run proxy)  
**GCP Project:** `dmm-01` · **Region:** `europe-west1`  
**Version:** 1.0.0 · **Last Updated:** 2026-04-29

---

## Purpose

Connect Cursor to the Regnology SQLX data model backend, enabling SQLX-facing agents
to query live data model definitions and retrieve SQLX manual chapters via MCP tools.

This server is the **preferred reference source** for all SQLX work.

---

## Architecture

```
Cursor (MCP client)
  └─ HTTP: http://localhost:8080/mcp
       └─ gcloud run services proxy (local tunnel, must be running)
            └─ Cloud Run: sqlx-mcp (project: dmm-01, region: europe-west1)
                 └─ PostgreSQL (Cloud SQL — live SQLX data model)
```

The `localhost:8080` endpoint is a `gcloud` proxy tunnel, not a locally-running server.
The proxy must be started before opening Cursor and kept running for the session.

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `query_datamodel_definitions` | Execute `SELECT` queries against the SQLX financial data model (entities, fields, domains, domain values) |
| `get_sqlx_manual_chapter` | Retrieve a specific chapter (0–31) of the SQLX technical manual |

---

## Setup

### Prerequisites

| Requirement | How to verify |
|-------------|---------------|
| Node.js ≥ 20 | `node -v` |
| gcloud CLI installed | `gcloud --version` |
| `cloud-run-proxy` component installed | see Step 2 |
| IAM `roles/run.invoker` on `dmm-01` | request from project admin |

### Step 1 — Install gcloud CLI (Debian/Ubuntu)

```bash
sudo apt-get install apt-transport-https ca-certificates gnupg curl
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
  | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
sudo apt-get update && sudo apt-get install google-cloud-sdk
```

### Step 2 — Install the cloud-run-proxy component

```bash
sudo apt-get install google-cloud-cli-cloud-run-proxy
```

### Step 3 — Authenticate

```bash
gcloud auth login
```

Log in with your `@regnology.net` Google Workspace account via SSO.
`gcloud auth application-default login` is **not required** for the proxy.

### Step 4 — Configure Cursor MCP

Add to `~/.cursor/mcp.json` (global scope, recommended for users):

```json
{
  "mcpServers": {
    "data-model-definitions": {
      "url": "http://localhost:8080/mcp",
      "type": "http"
    }
  }
}
```

The `templates/.cursor/mcp.json` in this repository already includes this entry.

### Step 5 — Start the proxy (each session)

Run in a **dedicated terminal** and keep it running:

```bash
gcloud run services proxy sqlx-mcp --region=europe-west1 --project=dmm-01 --port=8080
```

Expected output:
```
Proxying to Cloud Run service [sqlx-mcp] in project [dmm-01] region [europe-west1]
http://127.0.0.1:8080 proxies to https://sqlx-mcp-ufe5t2nsuq-ew.a.run.app
```

### Step 6 — Reload Cursor and verify

Restart Cursor (or reload MCP via **Settings → MCP**). Verify by running:

```sql
SELECT model_id, model_name, model_version FROM models LIMIT 3
```

Expected: models such as `GDM`, `Abacus360`, `Svenson`.

---

## GCP Projects

| Project | Region | Status |
|---------|--------|--------|
| `dmm-01` | `europe-west1` | Active — use this |
| `skynet-poc01` | `europe-west4` | Deprecated — temporary workaround only |

---

## Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `PERMISSION_DENIED: run.services.get` | IAM role not granted | Request `roles/run.invoker` on `dmm-01` |
| `cloud-run-proxy component not installed` | apt-managed gcloud disables component manager | `sudo apt-get install google-cloud-cli-cloud-run-proxy` |
| MCP shows disconnected in Cursor | Proxy terminal closed or not started | Re-run the `gcloud run services proxy` command |
| `/sse` returns 404 | Wrong endpoint — server uses `streamable-http` | Use `http://localhost:8080/mcp` with `"type": "http"` |
| `gcloud: command not found` after install | Shell PATH not reloaded | Open new terminal or `source ~/.zshrc` |
