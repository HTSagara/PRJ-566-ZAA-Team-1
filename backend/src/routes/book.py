import os
import boto3
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, Form, Request, status, Depends
from fastapi.responses import JSONResponse
from auth import auth_middleware, get_user_info
from utils.text2image import generate_image
from database.book_metadata import extract_metadata
from database.mongodb import get_mongodb_collection
from models.book import Book, extract_metadata, hash_email
from database.s3_db import delete_file_data 
from io import BytesIO
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Annotated, Optional

load_dotenv()
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
s3_client = boto3.client('s3')

router = APIRouter(dependencies=[Depends(auth_middleware)])

class BookFormData(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    file: UploadFile

# Define S3 client outside the route for reuse
s3 = boto3.client('s3')

@router.post("/book", tags=["book"])
async def upload_book(request: Request, data: Annotated[BookFormData, Form()]):

    # Validate uploaded book file
    file = data.file
    print("File Content", file)
    if file.content_type not in ("application/epub", "application/epub+zip", "application/pdf"):
        return JSONResponse(status_code=400, content={"message": "Invalid file type. Only EPUB or PDF files are allowed."})

    # Get user email
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    # Get metadata from file
    file_stream = BytesIO(await file.read())
    metadata = extract_metadata(file_stream, file.content_type)

    # Set title and author
    title = data.title or str(metadata and metadata["title"]) or file.filename or "Unknown"
    author = data.author or str(metadata and metadata["author"]) or "Unknown"

    # Create book object
    book = Book(user_email, title, author, file.content_type, file.size or 0) 

    # Upload book file
    book.setBookContent(file_stream)

    # Upload book metadata
    book.save()

    return book.get_metadata()

# GET /books - Retrieve Books Metadata API
@router.get("/books", tags=["book"])
async def retrieve_books(request: Request):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    # Hash the user's email to match the collection name (ownerId)
    owner_id = hash_email(user_email)  # using already defined function to hash the email

    # Retrieve books from MongoDB based on the owner's hashed email
    collection = get_mongodb_collection(owner_id)
    books = list(collection.find({}))  # Fetch all books for the user

    if not books:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No books found for this user")

    # Rename '_id' to 'id' in the response for each book
    for book in books:
        book['id'] = str(book.pop('_id'))

    return books
    

# GET /book/info/{id} this route gets book metadata from mongodb
@router.get("/book/info/{book_id}", tags=["book"])
async def get_book_info(request: Request, book_id: str):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    # Hash user's email to match collection name
    owner_id = hash_email(user_email)

    # Retrieve the book metadata from MongoDB based on user's hashed email and the UUID field
    collection = get_mongodb_collection(owner_id)
    book_metadata = collection.find_one({"_id": book_id})

    if not book_metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Rename _id to id in the metadata after fetching
    book_metadata["id"] = str(book_metadata.pop("_id"))

    return JSONResponse(content=book_metadata)

# GET book content from amazon S3 bucket  
@router.get("/book/{book_id}", tags=["book"])
async def get_book_presigned_url(request: Request, book_id: str):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']
    owner_id = hash_email(user_email)  # Hash the user's email to get the S3 folder name

    # Define the S3 key for the book file
    s3_key = f"{owner_id}/{book_id}"

    try:
        # Generate a pre-signed URL for the S3 object
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600  # URL will expire in 1 hour
        )
        return {"url": presigned_url}

    except NoCredentialsError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="S3 credentials are missing or invalid")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Delete route for book
@router.delete("/book/{book_id}", tags=["book"])
async def delete_book(request: Request, book_id: str):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    try:
        # Hash the user's email to match the collection name (ownerId)
        ownerId = hash_email(user_email)
    
        # Deleting the book metadata from mongodb
        collection = get_mongodb_collection(ownerId)
        result = collection.delete_one({"_id": book_id})

        if result.deleted_count > 0:
            print(f"Book with ID {book_id} successfully deleted.")

            # S3 key where the book file is stored
            s3_key = f"{ownerId}/{book_id}"
    
            # Now deleing book from AWS s3
            response = delete_file_data(s3_key)

            # Step 3: Check S3 deletion result
            if response:
                print(f"Book file {s3_key} successfully deleted from S3.")
                return JSONResponse(
                    content={"message": "Book successfully deleted."},
                    status_code=status.HTTP_200_OK
                ) 
            else:
                print(f"Error deleting book file {s3_key} from S3.")
                return JSONResponse(
                    content={"message": "Error deleting book data from S3."},
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )  
        else:
            print(f"Error Deleting File metaData {book_id}.")
            return JSONResponse(
                content={"message": "Error deleting book metadata."},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_501_INTERNAL_SERVER_ERROR, detail=str(e))
        

# Pydantic model for the input
class CreateHighlight(BaseModel):
    text: str
    location: str

# POST /book/:id/highlight - Add a highlight to the book's metadata
@router.post("/book/{book_id}/highlight", tags=["book"])
async def add_book_highlight(request: Request, book_id: str, body: CreateHighlight, image: bool):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswie6f16fa1577b736d1d04271ab9d937755855acc49073ed53a783e2840baedc4bth("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']
    owner_id = hash_email(user_email)

    # Retrieve the book metadata from MongoDB
    collection = get_mongodb_collection(owner_id)
    book_metadata = collection.find_one({"_id": book_id})

    if not book_metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    imgUrl = None if not image else await generate_image(body.text)

    # Create a new highlight with UUID
    highlight_id = str(uuid.uuid4())
    highlight = {
        "id": highlight_id,
        "text": body.text,
        "imgUrl": imgUrl,
        "location": body.location
    }

    # Add the new highlight to the existing book's metadata
    if "highlights" not in book_metadata:
        book_metadata["highlights"] = []

    book_metadata["highlights"].append(highlight)

    # Update the book metadata in MongoDB
    collection.update_one({"_id": book_id}, {"$set": {"highlights": book_metadata["highlights"]}})

    # Response on success
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Successfully saved highlight!",
            "highlightId": highlight_id,
            "highlightText": highlight["text"],
            "bookId": book_id
        }
    )

# GET route for Retrieving all the highlights created for a book
@router.get("/book/{book_id}/highlights", tags=["book"])
async def get_all_highlights(request: Request, book_id: str):
    # Get user email from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]
    user_email = get_user_info(access_token)['email']

    try:
        # Hash the user's email to match the collection name (ownerId)
        ownerId = hash_email(user_email)
    
        # Getting the metaData which also have highlights
        collection = get_mongodb_collection(ownerId)
        result = collection.find_one({"_id": book_id}, {"highlights": 1, "_id": 0})
        
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

        highlights = result.get("highlights", [])

        return JSONResponse(content=highlights)
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_501_INTERNAL_SERVER_ERROR, detail=str(e))

# GET /book/:id/highlight - Get highlight by id
@router.get("/book/{book_id}/highlight/{highlight_id}", tags=["book"])
async def get_book_highlight(request: Request, book_id: str, highlight_id: str):

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

    if not book_metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Find highlight by id
    highlights = book_metadata.get("highlights", [])
    highlight = next((h for h in highlights if h["id"] == highlight_id), None)

    if not highlight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Highlight not found")

    # highlight metadata
    response_content = {
        "id": highlight["id"],
        "text": highlight["text"],
        "imgUrl": highlight.get("imgUrl"),
        "location": highlight.get("location", "Unknown location")
    }

    return JSONResponse(content=response_content, status_code=status.HTTP_200_OK)
