from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from jose import jwt, JWTError
import requests
from urllib.parse import urlencode

app = FastAPI()

# AWS Cognito Configuration
COGNITO_REGION = "us-east-1" 
COGNITO_USERPOOL_ID = "us-east-1_7rLTf9xC8"  
COGNITO_CLIENT_ID = "5nlgr8qrqjocvvg9o2sfrqnr5r"  
COGNITO_DOMAIN = "wordvision.auth.us-east-1.amazoncognito.com" 
COGNITO_ISSUER = f"https://cognito-idp.us-east-1.amazonaws.com/us-east-1_7rLTf9xC8"
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"  # URL for the JWKS (JSON Web Key Set)
REDIRECT_URI = "http://localhost:8000"  # Redirect URI (pointing to the root "/")

# Step 1: Authorization URL for Cognito Hosted UI
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

# Step 2: Handle Callback and Exchange Authorization Code for Tokens
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
        return {"id_token": id_token, "access_token": access_token}  # Return both tokens

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to exchange code for tokens")

# Step 3: Middleware Function to Verify JWT Tokens
def verify_jwt_token(token: str):
    try:
        # Fetch the public keys (JWKS) from Cognito
        jwks = requests.get(JWKS_URL).json()
        print("Fetched JWKS:", jwks)
        # Get the unverified JWT header to find the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        print("Unverified JWT header:", unverified_header)
        rsa_key = None

        # Search for the RSA key matching the kid in the JWKS
        for key in jwks['keys']:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break

        if rsa_key is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not find RSA key")

        # Decode and verify the JWT token using the found RSA key
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER
        )
        print("Token payload:", payload)
        return payload  # Return the decoded token if it's valid

    except JWTError as e:
        print(f"JWT verification error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Custom Middleware for Authentication
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Define routes that don't require authentication (e.g., public routes)
    if request.url.path not in ["/public", "/login","/"]:
        # Get the Authorization header from the request
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Authorization header missing"})

        # Extract the token from the Authorization header ("Bearer <token>")
        try:
            token = auth_header.split(" ")[1]
            verify_jwt_token(token)
        except Exception as e:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    # Proceed to the next middleware or route handler if the token is valid
    response = await call_next(request)
    return response

# Protected Route Example
@app.get("/protected")
async def protected_route():
    return {"message": "This is a protected route. Access granted."}

# Public Route Example (no authentication required)
@app.get("/public")
async def public_route():
    return {"message": "This is a public route. No authentication needed."}
