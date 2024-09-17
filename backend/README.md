This is a FastAPI server project. Below are the steps to set up and run the server.

## Requirements

- Python 3.12+
- `pip` or `pipenv` for dependency management

## Setup

1. Set up a virtual environment
   It's recommended to use a virtual environment to manage dependencies.

```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
venv\Scripts\activate  # On Windows
```

Using pipenv (if you prefer Pipfile):

```bash
pipenv shell
```

2. Install dependencies

```bash
pipenv install
```

3. Run the server

```bash
fastapi dev server.py
```

4. Test

```bash
curl http://127.0.0.1:8000/
```
