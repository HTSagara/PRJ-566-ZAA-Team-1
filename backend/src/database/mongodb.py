# src/database/mongodb.py
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()
MONGODB_DB_PASSWORD = os.getenv("MONGODB_DB_PASSWORD")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")
MONGODB_DB_COLLECTION = os.getenv("MONGODB_DB_COLLECTION")
URI = os.getenv("MONGODB_URI")

# Create a new client and connect to the server
client = MongoClient(URI, server_api=ServerApi('1'))
db = client[MONGODB_DB_NAME]
collection = db[MONGODB_DB_COLLECTION]

# Send a ping to confirm a successful connection
def db_connection():
    try:
        client.admin.command('ping')
        print(f"Connected to:\nDATABASE:{db}\nCOLLECTION:{collection}")
        print("Pinged your deployment. You successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(e)
        return False
    
def get_mongodb_collection(ownerId: str):
    try:
        return db[ownerId]  # Return the collection using the hashed email as the collection name
    except Exception as e:
        print(f"Error retrieving collection for ownerId {ownerId}: {e}")
        raise Exception(f"Could not retrieve collection for ownerId: {ownerId}")
