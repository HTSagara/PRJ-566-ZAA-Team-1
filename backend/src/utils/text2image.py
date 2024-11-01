# src/routes/text2image.py
import io
import os
import boto3
from gradio_client import Client
from dotenv import load_dotenv

load_dotenv()
hf_api_token = os.getenv("HF_API_TOKEN")
hf_space = os.getenv("HF_SPACE")

# AWS S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("COGNITO_REGION")
s3_client = boto3.client('s3', region_name=os.getenv(AWS_REGION))

# Initialize the Hugging Face Space client
client = Client(hf_space, hf_api_token)

def generate_image(prompt: str, highlight_id: str, book_id: str):

    # Send prompt to Hugging Face Space and receive the result
    result = client.predict(
        param_0=prompt,
        api_name="/predict"
    )

    # Check if result is a local file path and open the image
    if isinstance(result, str) and os.path.isfile(result):
        # Open the image file and load the data
        with open(result, "rb") as img_file:
            img_data = img_file.read()
    else:
        raise ValueError(f"Unexpected response format or file not found. Response: {result}")

    # Prepare file name and S3 path
    file_name = f"{highlight_id}.png"
    s3_key = f"{book_id}/{file_name}"

    # Upload the image data to S3 with public-read access
    s3_client.upload_fileobj(io.BytesIO(img_data), S3_BUCKET_NAME, s3_key)

    # Construct URL to access the uploaded image
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
