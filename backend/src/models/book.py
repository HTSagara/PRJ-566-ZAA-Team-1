# src/models/book.py
from fastapi import HTTPException
from io import BytesIO
import hashlib
import uuid
import os
import pymupdf
from datetime import datetime
from dotenv import load_dotenv
from database.mongodb import db
from database.s3_db import write_file_data

load_dotenv()
BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

# Book class definition
class Book:
    def __init__(self, owner_email: str, title: str, author: str, book_type: str, size: int):
        self.id = str(uuid.uuid4())
        self.ownerId = hash_email(owner_email)
        self.created = datetime.now().isoformat()
        self.updated = self.created
        self.type = book_type
        self.size = size
        self.title = title
        self.author = author
        self.imgUrl = None

    def setBookContent(self, book_file: BytesIO):
        # Define the S3 key (where the book will be stored in the bucket)
        s3_key = f"{self.ownerId}/{self.id}"
        success = write_file_data(s3_key, self.type, book_file)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to upload file to S3")
        else:
            print(f"Successfully uploaded book with id: {self.id} to S3")

    def save(self):
        # Save the book metadata to MongoDB
        self.updated = datetime.now().isoformat()
        collection = db[self.ownerId]
        book_metadata = self.__dict__
        collection.insert_one(book_metadata)
        print(f"Book metadata saved to MongoDB with ID: {self.id}")

# Helper function to hash email
def hash_email(email: str) -> str:
    return hashlib.sha256(email.encode()).hexdigest()

# Helper function to extract metadata from book
def extract_metadata(file: BytesIO, type: str):
    doc = pymupdf.open(stream=file, filetype=type)
    return doc.metadata
