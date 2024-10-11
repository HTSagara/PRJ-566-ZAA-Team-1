# Use an official Python runtime as a parent image
FROM python:3.12-alpine3.19@sha256:708747cd8faaa772fcbd8f9950c83cdd220d9ff9f178cfd7dcddf1597958b246

# Set the working directory in the container
WORKDIR /app

# Copy the entire backend folder into the container
COPY . /app

# Install any dependencies specified in the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Change the working directory to /app/src for the app code
WORKDIR /app/src

# Expose the port on which the app will run
EXPOSE 8000

# Command to run the FastAPI server using Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/src"]

