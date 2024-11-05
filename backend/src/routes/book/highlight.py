import os
import boto3
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pydantic import BaseModel
from ...auth import get_user_info
from ...database.mongodb import get_mongodb_collection
from ...models.book import hash_email
from ...models.highlight import Highlight
from ...utils.text2image import overwrite_image

load_dotenv()
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("COGNITO_REGION")
s3_client = boto3.client('s3')

# Define S3 client outside the route for reuse
s3 = boto3.client('s3')

router = APIRouter(prefix="/book/{book_id}")

# Pydantic model for the input
class CreateHighlight(BaseModel):
    text: str
    location: str

# POST /book/:id/highlight - Add a highlight to the book's metadata
@router.post("/highlight", tags=["highlight"])
async def add_book_highlight(request: Request, book_id: str, body: CreateHighlight, image: bool = False):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']
    owner_id = hash_email(user_email)

    # Retrieve the book metadata from MongoDB
    collection = get_mongodb_collection(owner_id)
    book_metadata = collection.find_one({"_id": book_id})

    # Call create_highlight from Highlight model
    highlight = Highlight(text=body.text, location=body.location, bookId=book_id, ownerId=owner_id)
    return highlight.create_highlight(image)


@router.get("/highlights", tags=["highlight"])
async def get_all_highlights(request: Request, book_id: str):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']
    owner_id = hash_email(user_email)

    # Call the static method with required arguments
    highlight_instance = Highlight(bookId=book_id, ownerId=owner_id)
    highlights = highlight_instance.get_highlights()
    highlights_dict = [highlight.dict() for highlight in highlights]

    return JSONResponse(content=highlights_dict)


# GET /book/:id/highlight - Get highlight by id
@router.get("/highlight/{highlight_id}", tags=["highlight"])
async def get_book_highlight(request: Request, book_id: str, highlight_id: str):

    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    owner_id = hash_email(user_email)

    # Instantiate a Highlight object with bookId, ownerId, and highlight_id 
    highlight_instance = Highlight(id=highlight_id, bookId=book_id, ownerId=owner_id)
    highlight = highlight_instance.get_highlight_by_id()

    return JSONResponse(content=highlight, status_code=status.HTTP_200_OK)


# Delete Highlight API
@router.delete("/highlight/{highlightid}", tags=["highlight"])
async def delete_highlight(request: Request, bookid: str, highlightid: str):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    # Hash the user's email to match the collection name (ownerId)
    owner_id = hash_email(user_email)

    # Call delete_highlight from Highlight model
    Highlight.delete_highlight(bookid, highlightid, owner_id)

    return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Successfully deleted highlight!"})


@router.put("/highlight/{highlight_id}", tags=["highlight"])
async def regenerate_highlight_image(request: Request, book_id: str, highlight_id: str):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    
    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']
    owner_id = hash_email(user_email)
    
    # Query the MongoDB for the book document and find the highlight by ID
    collection = get_mongodb_collection(owner_id)
    book_metadata = collection.find_one({"_id": book_id})
    
    # Extract the highlight text based on highlight_id
    highlight_data = next((highlight for highlight in book_metadata.get("highlights", []) if highlight["id"] == highlight_id), None)
    
    if not highlight_data:
        raise HTTPException(status_code=404, detail="Highlight not found")

    # Retrieve the highlight's text for the prompt
    prompt = highlight_data.get("text")
    if not prompt:
        raise HTTPException(status_code=500, detail="Highlight text is missing")

    # Prepare S3 key for the image
    s3_key = f"{owner_id}/{book_id}/{highlight_id}.png"
    print(f"S3 Key: {s3_key}")

    # Call overwrite_image with the text prompt and S3 key
    overwrite_image(prompt, s3_key)

    return JSONResponse(
        status_code=200,
        content={
            "message": "Image successfully regenerated and overwritten in S3.",
            "highlight_id": highlight_id,
            "imgUrl": f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        }
    )
