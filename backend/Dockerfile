# Use an official Python runtime as a parent image
FROM python:3.12-slim@sha256:e38062874c7a45323cdd9a4c5241d18821c320a6c761f20a4640523ebf42b03e

# Set the working directory in the container
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt /app

# Install any dependencies specified in the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder into the container
COPY . /app

# Change the working directory to /app/src for the app code
WORKDIR /app/src

# Expose the port on which the app will run
EXPOSE 8000

# Command to run the FastAPI server using Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/src"]

