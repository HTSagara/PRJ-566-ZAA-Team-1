import os
import boto3
from fastapi import APIRouter, HTTPException, UploadFile, Form, Request, status, Response
from fastapi.responses import JSONResponse
from io import BytesIO
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Annotated, Optional
from ...database.book_metadata import extract_metadata
from ...database.mongodb import get_mongodb_collection
from ...database.s3_db import delete_folder 
from ...models.book import Book, extract_metadata
from . import highlight

load_dotenv()
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("COGNITO_REGION")
s3_client = boto3.client('s3')

# Define S3 client outside the route for reuse
s3 = boto3.client('s3')

router = APIRouter()

# include highlight routes
router.include_router(highlight.router)




class BookFormData(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    file: UploadFile

# New Class for Book Settings

class BookSettings(BaseModel):

    font_size: str  # Example: "16px"

    dark_mode: bool  # True for dark mode, False for light mode

@router.post("/book", tags=["book"])
async def upload_book(request: Request, data: Annotated[BookFormData, Form()]):
    user_email = request.state.user['email']

    # Validate uploaded book file
    file = data.file
    print("File Content", file)
    if file.content_type not in ("application/epub", "application/epub+zip", "application/pdf"):
        return JSONResponse(status_code=400, content={"message": "Invalid file type. Only EPUB or PDF files are allowed."})

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


@router.put("/book/{book_id}", tags=["book"])

async def update_book_settings(request: Request, book_id: str, settings: BookSettings):

    """

    Update book-specific settings like font size and dark mode in the database.

    """
    owner_id = request.state.user["id"]



    # Get MongoDB collection

    collection = get_mongodb_collection(owner_id)
    # Prepare update data

    update_data = {

        "settings.font_size": settings.font_size,

        "settings.dark_mode": settings.dark_mode,

    }



    # Update the book settings in MongoDB

    result = collection.update_one(

        {"_id": book_id, "ownerId": owner_id},  # Match book and owner

        {"$set": update_data}  # Update fields

    )



    if result.matched_count == 0:

        raise HTTPException(status_code=404, detail="Book not found.")

    if result.modified_count == 0:

        return {"message": "No changes were made."}



    return {"message": "Successfully updated book settings."}

# GET /books - Retrieve Books Metadata API
@router.get("/books", tags=["book"])
async def retrieve_books(request: Request):
    owner_id = request.state.user["id"]

    # Retrieve books from MongoDB based on the owner's hashed email
    collection = get_mongodb_collection(owner_id)
    books = list(collection.find({}))  # Fetch all books for the user

    if not books:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    # Rename '_id' to 'id' in the response for each book
    for book in books:
        book['id'] = str(book.pop('_id'))

    return books




# GET /book/info/{id} this route gets book metadata from mongodb
@router.get("/book/info/{book_id}", tags=["book"])
async def get_book_info(request: Request, book_id: str):
    owner_id = request.state.user["id"]

    # Retrieve the book metadata from MongoDB based on user's hashed email and the UUID field
    collection = get_mongodb_collection(owner_id)
    book_metadata = collection.find_one({"_id": book_id})

    if not book_metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Rename _id to id in the metadata after fetching
    book_metadata["id"] = str(book_metadata.pop("_id"))

    return JSONResponse(content=book_metadata)

# fetch book settings
@router.get("/book/{book_id}/settings", tags=["book"])
async def get_book_settings(request: Request, book_id: str):
    """
    Retrieve book-specific settings. Ensure the 'settings' key exists, and initialize if not present.
    """
    owner_id = request.state.user["id"]

    # Get MongoDB collection
    collection = get_mongodb_collection(owner_id)

    # Try to find the book document
    book_metadata = collection.find_one({"_id": book_id, "ownerId": owner_id})

    if not book_metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Check if 'settings' exists; if not, initialize with default values
    if "settings" not in book_metadata:
        default_settings = {
            "font_size": 16,
            "dark_mode": False
        }
        collection.update_one(
            {"_id": book_id, "ownerId": owner_id},
            {"$set": {"settings": default_settings}}
        )
        book_metadata["settings"] = default_settings

    return JSONResponse(content=book_metadata["settings"])


# GET book content from amazon S3 bucket  
@router.get("/book/{book_id}", tags=["book"])
async def get_book_presigned_url(request: Request, book_id: str):
    owner_id = request.state.user["id"]

    # Define the S3 key for the book file
    s3_key = f"{owner_id}/{book_id}/book.epub"

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
    owner_id = request.state.user["id"]

    try:
        # Deleting the book metadata from mongodb
        collection = get_mongodb_collection(owner_id)
        result = collection.delete_one({"_id": book_id})

        if result.deleted_count > 0:
            print(f"Book with ID {book_id} successfully deleted.")

            # S3 key where the book folder is stored
            book_folder = f"{owner_id}/{book_id}/"
    
            # Now deleting book from AWS s3
            response = delete_folder(book_folder)

            # Step 3: Check S3 deletion result
            if response:
                print(f"Book {book_folder} successfully deleted from S3.")
                return JSONResponse(
                    content={"message": "Book successfully deleted."},
                    status_code=status.HTTP_200_OK
                ) 
            else:
                print(f"Error deleting book {book_folder} from S3.")
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
