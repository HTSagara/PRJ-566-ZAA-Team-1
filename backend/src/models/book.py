# src/models/book.py
import boto3
import hashlib
import uuid
import os
from datetime import datetime
from ebooklib import epub
from pymongo import MongoClient
from dotenv import load_dotenv
from database.mongodb import db_connection, db, URI, client


load_dotenv()
db_connection()

# S3 client and bucket initialization
s3_client = boto3.client('s3')
BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")



# Helper function to hash email
def hash_email(email: str) -> str:
    return hashlib.sha256(email.encode()).hexdigest()

# Book class definition
class Book:
    def __init__(self, owner_email: str, file, title: str = None, author: str = None, book_type: str = "epub", size: int = None):
        self.id = str(uuid.uuid4())
        self.ownerId = hash_email(owner_email)
        self.created = datetime.now()
        self.updated = self.created
        self.type = book_type
        self.size = size
        self.title = title or file.name
        self.author = author or "N/A"
        self.imgUrl = None

    def setBookContent(self, book_file):
        # Define the S3 key (where the book will be stored in the bucket)
        s3_key = f"{self.ownerId}/{self.id}.{self.type}"
        
        try:
            # Upload the file to S3
            s3_client.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=book_file)
            print(f"Book uploaded to S3 at: {s3_key}")
        except Exception as e:
            raise Exception(f"Failed to upload book to S3: {str(e)}")


    def save(self, image_file=None):
        # If there is an image file, upload it to S3 and set the imgUrl
        if image_file:
            img_key = f"{self.ownerId}/images/{self.id}.{image_file.filename.split('.')[-1]}"
            s3_client.upload_fileobj(image_file, BUCKET_NAME, img_key)
            self.imgUrl = f"https://{BUCKET_NAME}.s3.amazonaws.com/{img_key}"

        # Save the book metadata to MongoDB
        collection = db[self.ownerId]
        book_metadata = self.__dict__
        collection.insert_one(book_metadata)
        self.updated = datetime.now()
        print(f"Book metadata saved to MongoDB with ID: {self.id}")

