from fastapi import HTTPException, status, Request
from jose import jwt, JWTError
import requests
import os

# load_env() is already run on server.py
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_ISSUER = os.getenv("COGNITO_ISSUER")
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Function to Verify JWT Tokens
def verify_jwt_token(token: str):
    try:
        # Fetch the public keys (JWKS) from Cognito
        print(f"JWKS URL: {JWKS_URL}")
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
        print("Decoded payload:", payload)  # Check if the payload contains the expected audience and issuer
        return payload  # Return the decoded token if it's valid

    except JWTError as e:
        print(f"JWT verification error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# Custom Middleware for Authentication
async def auth_middleware(request: Request):

    # Get the Authorization header from the request
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

    # Extract the token from the Authorization header ("Bearer <token>")
    token = auth_header.split(" ")[1]
    token_payload = verify_jwt_token(token)
    request.state.user = token_payload

    return request
