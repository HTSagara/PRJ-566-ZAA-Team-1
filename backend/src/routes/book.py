from fastapi import APIRouter, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from database.db import collection, db_connection
from database.book_metadata import process_epub

router = APIRouter()

# Route to upload and process an EPUB file, extract metadata, and save it
@router.post("/upload-epub")
async def upload_epub(file: UploadFile = File(...)):
    file_location = f"/app/uploads/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    
    # Process the file (call process_epub for instance)
    process_epub(file_location)
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}