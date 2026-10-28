import sys
from pathlib import Path

# Add backend directory to sys.path so app and its dependencies can be resolved
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app as _fastapi_app


class VercelPathMiddleware:
    """
    Vercel serverless rewrites incoming URLs to /api/index.py before invoking ASGI.
    This middleware restores the true requested URL path from Vercel's x-matched-path
    header BEFORE Starlette's route matching runs.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = {k.lower(): v for k, v in scope.get("headers", [])}
            matched_path = (
                headers.get(b"x-matched-path")
                or headers.get(b"x-forwarded-uri")
                or headers.get(b"x-original-uri")
            )
            if matched_path:
                clean_path = matched_path.decode("utf-8", errors="ignore").split("?")[0]
                scope["path"] = clean_path
                scope["raw_path"] = clean_path.encode("utf-8")
            elif scope.get("path", "").startswith("/api/index.py"):
                remainder = scope["path"][len("/api/index.py"):]
                scope["path"] = remainder if remainder else "/"
                scope["raw_path"] = scope["path"].encode("utf-8")
        await self.app(scope, receive, send)


app = VercelPathMiddleware(_fastapi_app)
