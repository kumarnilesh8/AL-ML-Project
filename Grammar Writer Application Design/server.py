#!/usr/bin/env python3
"""
Grammar Writer — vvv-hosted server
Serves the app and proxies LLM calls through vvv's AI model gateway.
"""
import json
import os
import urllib.error
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", "8080"))
SERVE_DIR = Path(__file__).parent
GATEWAY_URL = (os.environ.get("VVV_AI_MODEL_GATEWAY_URL") or "").rstrip("/")
# vvv allowlist default; omit model on the wire to get platform default
DEFAULT_MODEL = "gemini-3.1-flash-lite"
BLOCKED_PATHS = {".env", "server.py", "vvv.json", "submit-metadata.json", "app.zip"}


def gateway_id_token(audience: str) -> str:
    """OIDC identity token for service-to-service calls on Cloud Run."""
    import google.auth.transport.requests
    import google.oauth2.id_token

    request = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(request, audience)


class GrammarWriterHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SERVE_DIR), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        clean = parsed.path.lstrip("/")

        if parsed.path == "/health":
            body = b'{"status":"ok"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if clean in BLOCKED_PATHS or clean.startswith(".vvv/") or clean.startswith(".git"):
            self.send_error(403, "Forbidden")
            return

        if clean in ("",):
            self.path = "/index.html"

        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        if urlparse(self.path).path.startswith("/api/gemini"):
            self._proxy_gemini()
        else:
            self.send_error(404)

    def _proxy_gemini(self):
        if not GATEWAY_URL:
            self._json_error(
                503,
                "VVV_AI_MODEL_GATEWAY_URL is not set. "
                "This application must run on vvv with aiAccessKind=AI.",
            )
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            inbound = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json_error(400, "Request body must be JSON")
            return

        # Normalize to the vvv / Vertex generateContent shape.
        # The browser historically sends Studio-style bodies (no role, responseMimeType)
        # which Google rejects with GCP_INVALID_REQUEST on the gateway.
        contents = self._normalize_contents(inbound)
        src_cfg = inbound.get("generationConfig") or {}
        temperature = src_cfg.get("temperature", 0.2)
        max_out = src_cfg.get("maxOutputTokens", 2048)
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_out,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        qs = parse_qs(urlparse(self.path).query)
        model = qs.get("model", [None])[0]
        # Only allowlisted models; otherwise omit → gateway default
        allow = {"gemini-3.1-flash-lite"}
        if model in allow:
            payload["model"] = model


        try:
            token = gateway_id_token(GATEWAY_URL)
        except Exception as exc:
            self._json_error(502, f"Failed to mint gateway identity token: {exc}")
            return

        url = f"{GATEWAY_URL}/api/ai/generateContent"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self._cors_headers()
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as exc:
            error_body = exc.read()
            self.send_response(exc.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(error_body)))
            self._cors_headers()
            self.end_headers()
            self.wfile.write(error_body)
        except Exception as exc:
            self._json_error(502, f"Gateway proxy error: {exc}")

    def _normalize_contents(self, inbound):
        """Force role=user and text parts; drop unsupported Studio fields."""
        if "contents" in inbound and isinstance(inbound["contents"], list):
            out = []
            for item in inbound["contents"]:
                if not isinstance(item, dict):
                    continue
                parts = item.get("parts") or []
                text_parts = []
                for part in parts:
                    if isinstance(part, dict) and "text" in part:
                        text_parts.append({"text": part["text"]})
                if not text_parts:
                    continue
                out.append({"role": item.get("role") or "user", "parts": text_parts})
            if out:
                return out

        prompt = inbound.get("prompt") or inbound.get("text") or ""
        return [{"role": "user", "parts": [{"text": prompt}]}]

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _json_error(self, code, message):
        body = json.dumps({"error": {"code": code, "message": message}}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


if __name__ == "__main__":
    print(f"Grammar Writer listening on 0.0.0.0:{PORT}")
    print(f"  gateway: {GATEWAY_URL or '(not set)'}")
    print(f"  env: {os.environ.get('VVV_ENVIRONMENT_NAME', 'local')}")
    server = HTTPServer(("0.0.0.0", PORT), GrammarWriterHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
