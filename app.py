"""Loopback-only rule reference with explicit offline and server-side Claude modes."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlsplit

from claude import BACKEND, MODEL, MAX_CONTEXT_BYTES, MAX_DOCUMENTS, MAX_OUTPUT_TOKENS, Haiku, LiveError, load_api_key
from rules import ROOT, Rulebook

# Locally stored Flaticon artwork (attribution in the page footer and README); fixed allowlist.
ICONS = {f"/icons/{name}.png" for name in ("pikachu", "pokeball", "psyduck", "snorlax", "ditto")}


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, format, *args):
        # Never log questions or chat payloads. Paths alone can also contain query text.
        pass

    def respond(self, status, body, content_type="application/json; charset=utf-8"):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(body)

    def local_request(self):
        port = self.server.server_port
        hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}
        origin = self.headers.get("Origin")
        if self.headers.get("Host") not in hosts or (origin and origin not in {f"http://{h}" for h in hosts}):
            self.respond(403, {"error": "This app accepts only its loopback host and same-origin requests."})
            return False
        return True

    def do_GET(self):
        if not self.local_request():
            return
        route = urlsplit(self.path)
        book = self.server.book
        if route.path == "/api/info":
            self.respond(200, {"default_mode": self.server.default_mode,
                               "backends": {"offline": book.policy["backend"], "live": BACKEND},
                               "live": {"model": MODEL, "key_configured": bool(self.server.haiku.api_key),
                                        "max_output_tokens": MAX_OUTPUT_TOKENS,
                                        "max_context_bytes": MAX_CONTEXT_BYTES, "max_documents": MAX_DOCUMENTS},
                               "provenance": book.provenance, "passage_count": len(book.passages),
                               "samples": book.policy["samples"], "max_question_length": book.policy["max_question_length"]})
        elif route.path == "/api/sources":
            query = parse_qs(route.query).get("q", [""])[0]
            if len(query) > 1200:
                self.respond(400, {"error": "Keep source searches to 1200 characters."})
                return
            passages = book.search(query, len(book.passages))
            self.respond(200, {"sources": [book.source(p) for p in passages], "count": len(passages)})
        elif route.path == "/rulebook.md":
            self.respond(200, book.raw.encode(), "text/plain; charset=utf-8")
        elif route.path in {"/", "/app.js", "/styles.css"}:
            filename, mime = {"/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript"),
                              "/styles.css": ("styles.css", "text/css")}[route.path]
            self.respond(200, (ROOT / "web" / filename).read_bytes(), mime + "; charset=utf-8")
        elif route.path in ICONS:
            self.respond(200, (ROOT / "web" / route.path.lstrip("/")).read_bytes(), "image/png")
        else:
            self.respond(404, {"error": "Page not found."})

    def do_POST(self):
        if not self.local_request():
            return
        if self.path != "/api/ask":
            self.respond(404, {"error": "Endpoint not found."})
            return
        if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            self.respond(415, {"error": "Send application/json."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 8192:
                self.respond(413, {"error": "Request must be between 1 and 8192 bytes."})
                return
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict) or set(body) != {"question", "mode"}:
                raise ValueError("Send only question and mode fields; live game state is not accepted.")
            if body["mode"] not in ("offline", "live"):
                raise ValueError("Choose offline or live mode explicitly.")
            if body["mode"] == "live":
                result = self.server.haiku.answer(body["question"])
            else:
                result = {**self.server.book.answer(body["question"]), "mode": "offline",
                          "model": None, "response_method": "extractive", "usage": None}
        except LiveError as error:
            self.respond(error.status, error.response())
            return
        except (ValueError, UnicodeDecodeError) as error:
            self.respond(400, {"error": str(error) if not isinstance(error, json.JSONDecodeError) else "Invalid JSON."})
            return
        except TimeoutError:
            self.respond(408, {"error": "Request timed out. Try again."})
            return
        self.respond(200, result)


def main():
    parser = argparse.ArgumentParser(description="Start the loopback-only Poke Monopoly rule-reference app.")
    parser.add_argument("--port", type=int, default=4930)
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data", help="Folder containing rulebook.md, provenance.json and answer-policy.json")
    parser.add_argument("--mode", choices=("offline", "live"), default="offline", help="Initially selected browser mode (default: offline); never switches after a provider error")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    try:
        book = Rulebook(args.data_dir)
        api_key = load_api_key()
        server = LocalServer(("127.0.0.1", args.port), Handler)
    except (OSError, ValueError, KeyError) as error:
        print(f"Cannot start: {error}", file=sys.stderr)
        return 1
    server.book = book
    server.haiku = Haiku(book, api_key)
    server.default_mode = args.mode
    print(f"Poke Monopoly Rules Helper: http://127.0.0.1:{args.port}", flush=True)
    print(f"Default: {args.mode} | Live model: {MODEL} | Credential: {'configured (not verified)' if api_key else 'missing'} | {len(book.passages)} labeled passages | Ctrl+C to stop", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
