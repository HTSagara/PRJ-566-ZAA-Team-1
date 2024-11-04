# src/models/highlight.py
from pydantic import BaseModel, Field
import uuid
from typing import Optional, List, Dict
from database.mongodb import get_mongodb_collection
from fastapi import HTTPException
from utils.text2image import generate_image

class Highlight(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    text: Optional[str] = None
    location: Optional[str] = None
    imgUrl: Optional[str] = None
    bookId: Optional[str] = None  # Made optional
    ownerId: Optional[str] = None  # Made optional

    def create_highlight(self, image: bool = False) -> Dict:
        self.imgUrl = generate_image(self.text, self.ownerId, self.id, self.bookId) if image else None
        highlight_data = self.dict()
        collection = get_mongodb_collection(self.ownerId)
        result = collection.update_one(
            {"_id": self.bookId},
            {"$push": {"highlights": highlight_data}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Failed to add highlight to book")
        
        return {
            "message": "Successfully saved highlight!",
            "highlightId": self.id,
            "highlightText": self.text,
            "imgUrl": self.imgUrl,
            "bookId": self.bookId
        }

    def delete_highlight(self) -> None:
        collection = get_mongodb_collection(self.ownerId)
        result = collection.update_one(
            {"_id": self.bookId},
            {"$pull": {"highlights": {"id": self.id}}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Highlight not found")

    
    def get_highlights(self) -> List[Dict]:
        collection = get_mongodb_collection(self.ownerId)
        result = collection.find_one({"_id": self.bookId}, {"highlights": 1, "_id": 0})

        if not result:
            raise HTTPException(status_code=404, detail="Book not found")

        # Ensure bookId and ownerId are only added if they aren't already in the highlight data
        highlights = [
            Highlight(**{**highlight, "bookId": self.bookId, "ownerId": self.ownerId})
            for highlight in result.get("highlights", [])
        ]
        return highlights


    def get_highlight_by_id(self) -> Dict:
        collection = get_mongodb_collection(self.ownerId)
        book_metadata = collection.find_one({"_id": self.bookId})

        if not book_metadata:
            raise HTTPException(status_code=404, detail="Book not found")

        highlight_data = next((h for h in book_metadata.get("highlights", []) if h["id"] == self.id), None)
        
        if not highlight_data:
            raise HTTPException(status_code=404, detail="Highlight not found")

        return highlight_data
