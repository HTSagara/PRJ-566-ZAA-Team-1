# src/database/db.py
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

MONGODB_DB_PASSWORD = os.getenv("MONGODB_DB_PASSWORD")

uri = f"mongodb+srv://wordvisionapp:{MONGODB_DB_PASSWORD}@wordvision.1jubm.mongodb.net/?retryWrites=true&w=majority&appName=WordVision"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
def db_connection():
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(e)
        return False