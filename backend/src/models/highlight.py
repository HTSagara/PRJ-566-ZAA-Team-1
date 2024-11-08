from pydantic import BaseModel, Field
import uuid
from typing import Optional, Dict
from fastapi import HTTPException

from ..utils.text2image import generate_image
from ..database.mongodb import get_mongodb_collection
from ..database.s3_db import delete_file_data

class Highlight(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    text: Optional[str] = None
    location: Optional[str] = None
    imgUrl: Optional[str] = None
    book_id: Optional[str] = None  # Made optional
    owner_id: Optional[str] = None  # Made optional

    def create_highlight(self, image: bool = False) -> Dict:

        if not self.text or not self.id or not self.owner_id or not self.book_id: 
            return {}

        self.imgUrl = generate_image(self.text, self.owner_id, self.id, self.book_id) if image else None
        highlight_data = self.model_dump()
        del highlight_data["book_id"]
        del highlight_data["owner_id"]
        collection = get_mongodb_collection(self.owner_id)
        print(highlight_data)
        result = collection.update_one(
            {"_id": self.book_id},
            {"$push": {"highlights": highlight_data}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Failed to add highlight to book")
        
        return {
            "message": "Successfully saved highlight!",
            "highlightId": self.id,
            "highlightText": self.text,
            "imgUrl": self.imgUrl,
            "bookId": self.book_id
        }

    def delete_highlight(self) -> None:

        if not self.owner_id:
            raise HTTPException(status_code=404, detail="Missing owner_id for highlight")

        collection = get_mongodb_collection(self.owner_id)

        document = collection.find_one(
            {"_id": self.book_id, "highlights.id": self.id},
            {"highlights.$": 1}
        )
        
        # Delete highlight image from s3 if it exists
        if document and "highlights" in document:
            highlight = document["highlights"][0]
            if "imgUrl" in highlight and highlight["imgUrl"]:
                s3_key = f"{self.owner_id}/{self.book_id}/images/{self.id}.png"
                delete_file_data(s3_key)

        # Delete highlight from mongodb
        result = collection.update_one(
            {"_id": self.book_id},
            {"$pull": {"highlights": {"id": self.id}}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Highlight not found")

    
    def get_highlights(self):
        if not self.owner_id:
            raise HTTPException(status_code=404, detail="Missing owner_id for highlight")

        collection = get_mongodb_collection(self.owner_id)
        result = collection.find_one({"_id": self.book_id}, {"highlights": 1, "_id": 0})

        if not result:
            raise HTTPException(status_code=404, detail="Book not found")

        return result.get("highlights", [])


    def get_highlight_by_id(self) -> Dict:
        if not self.owner_id:
            raise HTTPException(status_code=404, detail="Missing owner_id for highlight")

        collection = get_mongodb_collection(self.owner_id)
        book_metadata = collection.find_one({"_id": self.book_id})

        if not book_metadata:
            raise HTTPException(status_code=404, detail="Book not found")

        highlight_data = next((h for h in book_metadata.get("highlights", []) if h["id"] == self.id), None)
        
        if not highlight_data:
            raise HTTPException(status_code=404, detail="Highlight not found")

        return highlight_data
