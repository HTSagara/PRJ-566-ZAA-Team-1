# src/database/book_metadata.py
from ebooklib import epub
from .mongodb import db_connection, collection

db_connection()

# Function to extract metadata from an EPUB file
def extract_metadata(epub_path):
    # Load the EPUB book
    book = epub.read_epub(epub_path)
    
    # Extract metadata
    metadata = {
        "title": book.get_metadata("DC", "title")[0][0] if book.get_metadata("DC", "title") else None,
        "authors": [author[0] for author in book.get_metadata("DC", "creator")],
        "publisher": book.get_metadata("DC", "publisher")[0][0] if book.get_metadata("DC", "publisher") else None,
        "language": book.get_metadata("DC", "language")[0][0] if book.get_metadata("DC", "language") else None,
        "identifier": book.get_metadata("DC", "identifier")[0][0] if book.get_metadata("DC", "identifier") else None,
        "description": book.get_metadata("DC", "description")[0][0] if book.get_metadata("DC", "description") else None,
    }

    return metadata

# Function to save metadata to MongoDB
def save_metadata_to_mongodb(metadata):
    try:
        collection.insert_one(metadata)
        print("Metadata saved to MongoDB successfully!")
    except Exception as e:
        print(f"Failed to save metadata: {e}")

# Main function to extract metadata from an EPUB and save it to MongoDB
def process_epub(epub_path):
    metadata = extract_metadata(epub_path)
    print(f"Extracted Metadata: {metadata}")
    save_metadata_to_mongodb(metadata)

# Example usage
epub_file_path = "/app/src/epubs/poe-balloon-hoax-illustrations.epub"
process_epub(epub_file_path)