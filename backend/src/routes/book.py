from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from database.book_metadata import process_epub

router = APIRouter()

@router.post("/upload-epub")
async def upload_epub(file: UploadFile = File(...)):
    if not file.filename.endswith('.epub'):
        return JSONResponse(status_code=400, content={"message": "Invalid file type. Only EPUB files are allowed."})

    try:
        # Save the uploaded file
        file_location = f"/app/uploads/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Process the file (call process_epub for instance)
        process_epub(file_location)
        return {"info": f"file '{file.filename}' saved at '{file_location}'"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

