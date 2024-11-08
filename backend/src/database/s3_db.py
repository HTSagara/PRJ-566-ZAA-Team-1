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

def delete_file_data(key: str):
    try:
        # Deleting the file from S3
        response = s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
        
        # Check if the response indicates a successful deletion
        return response.get('ResponseMetadata', {}).get('HTTPStatusCode') == 204
    except ClientError as e:
        # Handle specific S3 errors or log the error message
        print(f"Failed to delete file {key}: {e}")
        return False

def delete_folder(folder_name: str):
    try:
        # List all objects in the "folder"
        objects = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=folder_name)
        
        # Check if the folder contains any objects
        if 'Contents' in objects:
            # Create a list of objects to delete
            delete_keys = [{'Key': obj['Key']} for obj in objects['Contents']]
            
            # Delete all objects in the folder
            s3_client.delete_objects(Bucket=S3_BUCKET_NAME, Delete={'Objects': delete_keys})
            print(f"Deleted folder: {folder_name}")
            return True
        else:
            print(f"No objects found in folder: {folder_name}")
            return False
    except ClientError as e:
        print(f"An error occurred: {e}")
        return False
