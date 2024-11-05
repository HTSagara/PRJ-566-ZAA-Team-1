# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt file
COPY requirements.txt /app/

# Install dependencies specified in requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder into the container
COPY . /app

# Expose the port on which the app will run
EXPOSE 8000

# Command to run the FastAPI server using Uvicorn
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
