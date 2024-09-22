# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Copy the entire backend folder into the container
COPY . /app

# Install any dependencies specified in the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port on which the app will run
EXPOSE 8000

# Command to run the FastAPI server using Uvicorn
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
