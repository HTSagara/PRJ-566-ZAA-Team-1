## Requirements

- [Docker](https://www.docker.com/products/docker-desktop) (Installed and running on your machine)

## Setup

### 1. Build the Docker Image

First, build the Docker image using the provided `Dockerfile`. Run the following command in the root of your project:

```bash
docker build -t wordvision-server .
```

This will create a Docker image named `wordvision-server`.

### 2. Run the Docker Container

Once the image is built, you can run the FastAPI server inside a Docker container. Use the following command to start the container:

```bash
docker run -d -p 8000:8000 wordvision-server
```

This command runs the container in detached mode (`-d`), and maps port `8000` on the container to port `8000` on your local machine, so you can access the FastAPI app at `http://localhost:8000/`.

### 3. Test the Server

Once the container is running, you can test the FastAPI server by accessing the root endpoint.

#### a. Using a Browser:

Navigate to:

```
http://localhost:8000/
```

You should see a JSON response like:

```json
{
  "status": "healthy",
  "app": "My FastAPI Application",
  "version": "1.0.0",
  "timestamp": "2023-09-17T09:35:22.123456Z"
}
```

#### b. Using `curl`:

You can also test the server using `curl` in your terminal:

```bash
curl http://localhost:8000/
```

### 5. Stopping the Server

To stop the Docker container running the FastAPI server, list all running containers:

```bash
docker ps
```

Find the container ID for your FastAPI container and stop it with:

```bash
docker stop <container-id>
```

---
