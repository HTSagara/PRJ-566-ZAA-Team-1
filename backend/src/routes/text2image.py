# src/routes/text2image.py
import io
from fastapi import HTTPException, Depends, Request, APIRouter, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from diffusers import StableDiffusionPipeline
import torch
from PIL import Image
from dotenv import load_dotenv
from auth import verify_jwt_token, auth_middleware, get_user_info
import os

router = APIRouter(dependencies=[Depends(auth_middleware)])

# Initialize HuggingFace's Stable Diffusion pipeline
model_id = "CompVis/stable-diffusion-v1-4"
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize the model
pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    low_cpu_mem_usage=True  # Optimize memory usage for CPU
).to(device)

# Pydantic model for the input
class TextPrompt(BaseModel):
    prompt: str


@router.post("/generate-image", tags=["image"])
async def generate_image(request: Request, prompt: TextPrompt):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    try:
        # Generate the image using Stable Diffusion
        image = pipe(prompt.prompt).images[0]

        # Save the image to an in-memory buffer
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_buffer.seek(0)

        # Return the image as a streaming response
        return StreamingResponse(img_buffer, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
