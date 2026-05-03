import asyncio

from app.config import get_settings
from app.rag.loader import load_docx
from app.rag.chunker import chunk_text
from app.rag.embedder import get_embeddings

async def main():
    try:
        # 1. Load
        print("Loading...")
        with open("sample_document.docx", "rb") as f:
            content, metadata = load_docx(f.read())
        
        # 2. Chunk
        print("Chunking...")
        chunks, metadatas = chunk_text(content, metadata)
        print(f"Got {len(chunks)} chunks")
        
        # 3. Embed
        print("Embedding...")
        embeddings = get_embeddings()
        res = embeddings.embed_documents(chunks)
        print("Embed success!", len(res))
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Ensure env var is set via .env or OS environment
    settings = get_settings()
    if not settings.GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY is not set. Add it to .env before running.")
    asyncio.run(main())
