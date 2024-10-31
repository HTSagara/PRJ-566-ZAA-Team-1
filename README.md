<div align="center">

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=500&size=47&letterSpacing=.2rem&pause=1000&color=CDCAC6&vCenter=true&width=456&height=104&lines=WordVision)](https://git.io/typing-svg)

</div>

## Overview

A new way of reading books. Combining ePub books with AI-powered image generation, WordVision allows readers to create custom visuals by simply highlighting text, providing a uniquely immersive experience.

## Technology Stack

### Core Frameworks & Libraries

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) – A high-performance Python web framework for building APIs.
- **Frontend**: [Expo React Native](https://expo.dev/) – A cross-platform framework for mobile development.

### Key Integrations

- **Hugging Face Spaces**: Utilized for AI-driven image generation, ensuring efficient and high-quality visuals.
- **Docker**: Containerizes the app, enabling smooth local testing and deployment.

### Cloud & Database

- **AWS Cognito**: Manages user authentication securely.
- **AWS S3**: Used for storing generated images and ePub files.
- **MongoDB**: Stores metadata for books, annotations, and user-generated content.

## Getting Started

### Prerequisites

Ensure Docker is installed and running on your machine.

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
