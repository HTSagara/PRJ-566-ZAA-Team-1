from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse
from datetime import datetime, timezone
from urllib.parse import urlencode
from dotenv import load_dotenv
from urllib.parse import urlencode
import requests
import os

from .auth import auth_middleware
from .routes import user

load_dotenv()

COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_DOMAIN = os.getenv("COGNITO_DOMAIN")
REDIRECT_URI = os.getenv("REDIRECT_URI")

app = FastAPI()

# include user routes
app.include_router(user.router)

# Public Route Example (no authentication required)
@app.get("/public")
async def public_route():
    return { "message": "This is a public route. No authentication needed." }

# Protected Route Example
@app.get("/protected", dependencies=[Depends(auth_middleware)])
async def protected_route(req: Request):
    return { 
        "message": "This is a protected route. Access granted.", 
        "Authorization": req.headers.get("Authorization"),
    }

# Health check
# Note: revert back to "/" once frontend login has been implemented
@app.get("/healthcheck", status_code=200)
async def root():
    return {
        "status": "healthy",
        "app": "WordVision Server",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Login
# Note: delete this once frontend login has been implemented
@app.get("/login")
async def login():
    # Construct the Cognito login URL with the necessary parameters
    params = {
        "client_id": COGNITO_CLIENT_ID,
        "response_type": "code",  # Authorization Code Flow
        "scope": "openid",  # Requesting the ID token
        "redirect_uri": REDIRECT_URI
    }
    cognito_login_url = f"https://{COGNITO_DOMAIN}/login?{urlencode(params)}"
    return RedirectResponse(url=cognito_login_url)

# Root path for handling login callback
# Note: delete this once frontend login has been implemented
@app.get("/")
async def callback(code: str|None = None):
    if code is None:
        raise HTTPException(status_code=400, detail="Authorization code not found in request")

    # Exchange authorization code for tokens
    token_url = f"https://{COGNITO_DOMAIN}/oauth2/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": COGNITO_CLIENT_ID,
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    token_headers = {"Content-Type": "application/x-www-form-urlencoded"}

    # Send the request to get tokens
    response = requests.post(token_url, data=token_data, headers=token_headers)
    if response.status_code == 200:
        token_json = response.json()
        id_token = token_json.get("id_token")
        access_token = token_json.get("access_token")
        expires_in = token_json.get("expires_in")
        return {"id_token": id_token, "access_token": access_token, "expires_in": expires_in}  # Return both tokens

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to exchange code for tokens")
