# src/routes/text2image.py
import io
import os
import boto3
from gradio_client import Client
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
from PIL import Image

load_dotenv()
hf_api_token = os.getenv("HF_API_TOKEN")
hf_space = os.getenv("HF_SPACE")

# AWS S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("COGNITO_REGION")
s3_client = boto3.client('s3', region_name=os.getenv(AWS_REGION))

# Initialize the Hugging Face Space client
client = Client(hf_space, hf_api_token)

default_negative_prompt = (
    "blurry, out of focus, low quality, pixelated, distorted, overly saturated, "
    "bad anatomy, cropped, disfigured, unclear, artifacts, extra limbs, "
    "unnatural colors, deformed hands, poor lighting, overly dark, overly bright, "
    "grainy, noisy, cartoonish, text, watermark"
)

def hugging_face_call(prompt: str):
     # Send prompt to Hugging Face Space and receive the result
    result = client.predict(
        prompt=prompt,
        negative_prompt=default_negative_prompt,
        seed=0,
        randomize_seed=True,
        width=1024,
		height=1024,
		guidance_scale=4.5,
		num_inference_steps=40,
        api_name="/infer"
    )

    # Check if result is a file path and handle cases where it's a tuple
    if isinstance(result, tuple) and os.path.isfile(result[0]):
        result_path = result[0]  # Extract the path from the tuple
    elif isinstance(result, str) and os.path.isfile(result):
        result_path = result
    else:
        raise ValueError(f"Unexpected response format or file not found. Response: {result}")

    # Convert image to PNG if it’s a .webp file to ensure compatibility
    if result_path.endswith(".webp"):
        with Image.open(result_path) as img:
            png_img = io.BytesIO()
            img.save(png_img, format="PNG")
            png_img.seek(0)
            return png_img.read()  # Return PNG image data

    # Otherwise, read and return the original image data
    with open(result_path, "rb") as img_file:
        return img_file.read()

def generate_image(prompt: str, owner_id: str, highlight_id: str, book_id: str):

    img_data = hugging_face_call(prompt)

    # Prepare file name and S3 path
    file_name = f"{highlight_id}.png"
    s3_key = f"{owner_id}/{book_id}/images/{file_name}"

    # Upload the image data to S3 with public-read access
    s3_client.upload_fileobj(io.BytesIO(img_data), S3_BUCKET_NAME, s3_key)

    # Construct URL to access the uploaded image
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"


# Get the first image_id/name/s3_key
# Get the same prompt
# Generate the image with the same image_id/name/s3_key
# Save in a way to overwrite the previous image --> In this way, I dont need to create a new url and delete the previous one.

def overwrite_image(prompt: str, s3_key: str):
    img_data = hugging_face_call(prompt)
    
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=io.BytesIO(img_data)
        )
        print(f"File successfully overwritten at s3://{S3_BUCKET_NAME}/{s3_key}")
    except NoCredentialsError:
        print("Error: AWS credentials are missing or invalid.")
        raise
    except Exception as e:
        print(f"Error occurred while uploading to S3: {e}")
        raise

    

