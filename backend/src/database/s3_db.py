# src/database/s3_by.py

from io import BytesIO
import os
import boto3
from boto3.s3.transfer import S3UploadFailedError
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

load_dotenv()
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initializing the S3 client
s3_client = boto3.client('s3')

# Upload function for S3
def write_file_data(key: str, file_type: str, data: BytesIO):

    # Uploading the data to the S3 bucket
    try:
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=key, ContentType=file_type, Body=data)
        print(f"Data has been uploaded to the S3 bucket")
        return True
    except NoCredentialsError:
        print("Credentials not available")
        return False
    except S3UploadFailedError:
        print("Unable to upload file to S3 Bucket")
        return False
    except ClientError as e:
        print(f"Unexpected error occurred: {e}")
        return False

def read_file_data(key: str):
    try: 
        # Download the file from S3 into memory
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=key)
        file_data = response['Body'].read()
        return file_data
    except NoCredentialsError:
        print("Credentials not available")
        return None
    except ClientError as e:
        print(f"Error retrieving file from S3: {e}")
        return None