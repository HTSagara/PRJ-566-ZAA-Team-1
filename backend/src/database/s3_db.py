# src/database/s3_by.py

import io
import os
import uuid
import boto3
from boto3.s3.transfer import S3UploadFailedError
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

load_dotenv()
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initializing the S3 client
s3_client = boto3.client('s3')

# Upload function for S3
def write_file_data(file_Id, owner_Id, data):
    # Define the custom S3 key as ownerId/fileId
    object_name = f"{owner_Id}/{file_Id}"

    # Uploading the data to the S3 bucket
    try:
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=object_name, Body=data)
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
