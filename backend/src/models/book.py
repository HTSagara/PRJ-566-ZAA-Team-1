import boto3
import hashlib
import uuid
import os
from datetime import datetime
from ebooklib import epub
from pymongo import MongoClient
from dotenv import load_dotenv
from database.mongodb import db_connection, db


load_dotenv()
db_connection()
# s3_client = boto3.client('s3')
# BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
MONGO_URI = os.getenv("MONGODB_URI")


# Helper function to hash email
def hash_email(email: str) -> str:
    return hashlib.sha256(email.encode()).hexdigest()

# Book class definition
class Book:
    def __init__(self, owner_email: str, file, title: str = None, author: str = None, book_type: str = "epub"):
        self.id = str(uuid.uuid4())
        self.ownerId = hash_email(owner_email)
        self.created = datetime.now()
        self.updated = self.created
        self.type = book_type
        self.size = file.size
        self.title = title
        self.author = author
        self.imgUrl = None

    def setBookContent(self, book_file):
        # Upload the book file to S3
        pass

    def save(self, image_file=None):
        # TODO: Upload image, if available in S3
        
        # Save book metadata to MongoDB
        collection = db[self.ownerId]
        book_metadata = self.__dict__
        collection.insert_one(book_metadata)
        print(f"Book metadata saved to MongoDB with ID: {self.id}")

