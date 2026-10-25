"""
Unified application launcher for UK Wind Day-Ahead Decision & Forecast Analytics Platform.
Serves the FastAPI backend and mounted React frontend on http://localhost:8000.
"""
import sys
import os
from pathlib import Path

# Force UTF-8 stdout if needed
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_path))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8050))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"\n==================================================================")
    print(f"[*] AURA WIND | UK Day-Ahead Procurement & Forecast Risk Platform")
    print(f"[*] Serving Live on: http://localhost:{port}")
    print(f"[*] API Docs: http://localhost:{port}/docs")
    print(f"==================================================================\n")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)

