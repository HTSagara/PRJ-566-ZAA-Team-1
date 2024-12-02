# Contributing to WordVision

This guide will assist you in setting up the project for development using Docker.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
  - [Core Frameworks & Libraries](#core-frameworks--libraries)
  - [Key Integrations](#key-integrations)
  - [Cloud & Database](#cloud--database)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running the Project](#running-the-project)

## Overview

A new way of reading books. Combining ePub books with AI-powered image generation, WordVision allows readers to create custom visuals by simply highlighting text, providing a uniquely immersive experience.

## Technology Stack

### Core Frameworks & Libraries

- [**Backend**](https://github.com/HTSagara/PRJ-566-ZAA-Team-1/tree/main/backend): [FastAPI](https://fastapi.tiangolo.com/) – A high-performance Python web framework for building APIs.
- [**Frontend**](https://github.com/HTSagara/PRJ-566-ZAA-Team-1/tree/main/frontend): [Expo React Native](https://expo.dev/) – A cross-platform framework for mobile development.

### Key Integrations

- **Hugging Face Spaces**: Utilized for AI-driven image generation, ensuring efficient and high-quality visuals.
- **Docker**: Containerizes the app, enabling smooth local testing and deployment.

### Cloud & Database

- **AWS Cognito**: Manages user authentication securely.
- **AWS S3**: Used for storing generated images and ePub files.
- **MongoDB**: Stores metadata for books, annotations, and user-generated content.

## Getting Started

### Prerequisites

Ensure [Docker](https://docs.docker.com/get-started/get-docker/) is installed and running on your machine.

### Running the Project

**First-Time Setup**  
Build and run the Docker containers:

```bash
docker compose up --build
```

or if you have already built the images and have no changes, you could omit `--build`:

```bash
docker compose up
```

After running `docker compose up --build` the web app should be accessible in the browser on `http://localhost:8081/`
