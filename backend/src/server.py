# ./src/server.py
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from datetime import datetime, timezone
import requests
import os

from urllib.parse import urlencode
from dotenv import load_dotenv
from urllib.parse import urlencode
import auth.auth as authenticate


app = FastAPI()

load_dotenv()
COGNITO_REGION = os.getenv("COGNITO_REGION")
COGNITO_USERPOOL_ID = os.getenv("COGNITO_USERPOOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_DOMAIN = os.getenv("COGNITO_DOMAIN")
COGNITO_ISSUER = os.getenv("COGNITO_ISSUER")
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"
REDIRECT_URI = os.getenv("REDIRECT_URI")


# Custom Middleware for Authentication
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Define routes that don't require authentication (e.g., public routes)
    if request.url.path not in ["/public", "/login","/healthcheck", "/"]:
        # Get the Authorization header from the request
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Authorization header missing"})

        # Extract the token from the Authorization header ("Bearer <token>")
        try:
            token = auth_header.split(" ")[1]
            authenticate.verify_jwt_token(token)
        except Exception as e:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    # Proceed to the next middleware or route handler if the token is valid
    response = await call_next(request)
    return response

# Root
@app.get("/")  # Now handle the callback at the root path "/"
async def callback(code: str = None):
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


# Public Route Example (no authentication required)
@app.get("/public")
async def public_route():
    return {"message": "This is a public route. No authentication needed."}

# Protected Route Example
@app.get("/protected")
async def protected_route():
    return {"message": "This is a protected route. Access granted."}

# Health check at root "/"
@app.get("/healthcheck", status_code=200)
async def root():
    return JSONResponse(
        content={
            "status": "healthy",
            "app": "WordVision Server",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

# Login
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

