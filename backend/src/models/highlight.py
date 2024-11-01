# src/models/highlight.py
from pydantic import BaseModel
import uuid
from typing import Optional, List, Dict
from database.mongodb import get_mongodb_collection
from fastapi import HTTPException
from utils.text2image import generate_image
from datetime import datetime

class Highlight(BaseModel):
    id: str
    text: str
    location: str
    imgUrl: Optional[str] = None

    
    def create_highlight(book_id: str, owner_id: str, text: str, location: str, image: bool = False) -> Dict:
        highlight_id = str(uuid.uuid4())
        imgUrl = generate_image(text, highlight_id, book_id) if image else None

        # Create Highlight instance
        highlight = Highlight(id=highlight_id, text=text, location=location, imgUrl=imgUrl)

        # Convert highlight instance to dictionary for MongoDB storage
        highlight_data = highlight.dict()

        # Update the book document in MongoDB with the new highlight
        collection = get_mongodb_collection(owner_id)
        result = collection.update_one(
            {"_id": book_id},
            {"$push": {"highlights": highlight_data}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Failed to add highlight to book")

        # Return response with the new highlight details
        return {
            "message": "Successfully saved highlight!",
            "highlightId": highlight.id,
            "highlightText": highlight.text,
            "imgUrl": highlight.imgUrl,
            "bookId": book_id
        }
    
    
    def delete_highlight(book_id: str, highlight_id: str, owner_id: str) -> None:
        collection = get_mongodb_collection(owner_id)
        result = collection.update_one(
            {"_id": book_id},
            {"$pull": {"highlights": {"id": highlight_id}}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Highlight not found")
        
    
    def get_highlights(book_id: str, owner_id: str) -> List[Dict]:
        collection = get_mongodb_collection(owner_id)
        result = collection.find_one({"_id": book_id}, {"highlights": 1, "_id": 0})

        if not result:
            raise HTTPException(status_code=404, detail="Book not found")

        # Convert each highlight dictionary to a Highlight instance
        highlights = [Highlight(**highlight) for highlight in result.get("highlights", [])]

        return highlights
    
    
    def get_highlight_by_id(book_id: str, highlight_id: str, owner_id: str) -> Dict:
        collection = get_mongodb_collection(owner_id)
        book_metadata = collection.find_one({"_id": book_id})

        if not book_metadata:
            raise HTTPException(status_code=404, detail="Book not found")

        # Retrieve the specific highlight by id
        highlight_data = next((h for h in book_metadata.get("highlights", []) if h["id"] == highlight_id), None)
        
        if not highlight_data:
            raise HTTPException(status_code=404, detail="Highlight not found")

        # Convert dictionary to Highlight instance
        highlight = Highlight(**highlight_data)

        return highlight

