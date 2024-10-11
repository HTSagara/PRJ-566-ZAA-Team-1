# src/routes/book.py
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from models.book import hash_email
from models.book import Book
from database.book_metadata import process_epub
from database.s3_db import write_file_data
from io import BytesIO
import uuid

router = APIRouter()

@router.post("/upload-epub")
async def upload_epub(file: UploadFile = File(...)):
    if not file.filename.endswith('.epub'):
        return JSONResponse(status_code=400, content={"message": "Invalid file type. Only EPUB files are allowed."})

    try:
        # Read file content
        file_content = await file.read()

        # Convert bytes to a file-like object
        file_stream = BytesIO(file_content)

        # Generate fileId and ownerId (example, you can modify as per your need)
        file_id = str(uuid.uuid4())
        owner_id = hash_email("wordvision.app@gmail.com")

        # Write file data to S3
        upload_success = write_file_data(file_id, owner_id, file_stream)
        if not upload_success:
            raise HTTPException(status_code=500, detail="Failed to upload file to S3")
        else:
            print("File uploaded successfully to S3")

        # Optionally, save the file locally as well
        file_location = f"/app/uploads/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(file_content)

        # Since process_epub may use seek, reset file stream to the beginning
        file_stream.seek(0)

        # Process the file (call process_epub for instance)
        process_epub(file_location)

        return {"info": f"File '{file.filename}' successfully uploaded and saved at '{file_location}'"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
