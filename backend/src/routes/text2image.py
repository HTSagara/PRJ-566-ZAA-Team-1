# src/routes/text2image.py
import io
import os
import boto3
from fastapi import HTTPException, Depends, Request, APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from gradio_client import Client
from auth import auth_middleware
from dotenv import load_dotenv

load_dotenv()
hf_api_token = os.getenv("HF_API_TOKEN")
hf_space = os.getenv("HF_SPACE")

# AWS S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
s3_client = boto3.client('s3', region_name=os.getenv("AWS_REGION"))

router = APIRouter(dependencies=[Depends(auth_middleware)])

# Initialize the Hugging Face Space client
client = Client(hf_space, hf_api_token)

# Pydantic model for the input
class TextPrompt(BaseModel):
    prompt: str


@router.post("/generate-image", tags=["image"])
async def generate_image(request: Request, prompt: TextPrompt):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    try:
        # Send prompt to Hugging Face Space and receive the result
        result = client.predict(
            param_0=prompt.prompt,
            api_name="/predict"
        )

        # Check if result is a local file path and open the image
        if isinstance(result, str) and os.path.isfile(result):
            # Open the image file and load the data
            with open(result, "rb") as img_file:
                img_data = img_file.read()
        else:
            raise HTTPException(status_code=500, detail="Unexpected response format or file not found")

        # Prepare file name and S3 path
        file_name = f"{prompt.prompt[:10].replace(' ', '_')}_generated_image.png"
        s3_key = f"generated_images/{file_name}"

        # Upload the image data to S3
        s3_client.upload_fileobj(io.BytesIO(img_data), S3_BUCKET_NAME, s3_key)

        # Generate a presigned URL to access the uploaded image
        s3_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600  # URL expires in 1 hour
        )

        return JSONResponse(content={"s3_url": s3_url})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
