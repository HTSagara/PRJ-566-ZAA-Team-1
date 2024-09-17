# ./src/server.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

app = FastAPI()

# Health check at root "/"
@app.get("/", status_code=200)
async def root():
    return JSONResponse(
        content={
            "status": "healthy",
            "app": "WordVision Server",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

