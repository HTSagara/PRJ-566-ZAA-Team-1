# src/routes/book.py
from fastapi import APIRouter, HTTPException, UploadFile, Form, Request, status, Depends
from fastapi.responses import JSONResponse
from auth import auth_middleware, get_user_info
from database.book_metadata import extract_metadata
from database.mongodb import get_mongodb_collection
from models.book import Book, extract_metadata, hash_email
from io import BytesIO

from pydantic import BaseModel
from typing import Annotated, Optional

print(f"hello from book route")

router = APIRouter(dependencies=[Depends(auth_middleware)])

class BookFormData(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    file: UploadFile

@router.post("/book", tags=["book"])
async def upload_book(request: Request, data: Annotated[BookFormData, Form()]):

    # Validate uploaded book file
    file = data.file
    if file.content_type not in ("application/epub+zip", "application/pdf"):
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
    books = list(collection.find({}, {'_id': 0}))  # Fetch all books for the user and exclude the MongoDB _id field

    if not books:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No books found for this user")

    return books

# GET /book/info/{id}
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
    book_metadata = collection.find_one({"id": book_id}, {'_id': 0})

    if not book_metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    return JSONResponse(content=book_metadata)
