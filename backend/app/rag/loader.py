"""
Document loader — PDF, DOCX, URL text extraction.
Files are processed from bytes in memory, never written to disk.
"""

import io
from typing import Tuple, List

import httpx
import pdfplumber
from bs4 import BeautifulSoup
from docx import Document as DocxDocument

from app.utils.logger import logger


class DocumentLoadError(Exception):
    """Raised when document loading fails."""
    pass


def load_pdf(file_bytes: bytes) -> Tuple[str, List[dict]]:
    """
    Extract text from PDF bytes.
    Returns (full_text, list of {page: int, text: str} per page).
    """
    try:
        pages_data: List[dict] = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_data.append({"page": i + 1, "text": text})

        if not pages_data:
            raise DocumentLoadError("PDF tidak mengandung teks yang dapat diekstrak.")

        full_text = "\n\n".join(p["text"] for p in pages_data)
        logger.info(f"PDF loaded: {len(pages_data)} pages, {len(full_text)} chars")
        return full_text, pages_data

    except DocumentLoadError:
        raise
    except Exception as e:
        logger.error(f"Failed to load PDF: {e}")
        raise DocumentLoadError(f"Gagal memproses PDF: {str(e)}")


def load_docx(file_bytes: bytes) -> Tuple[str, List[dict]]:
    """
    Extract text from DOCX bytes.
    Returns (full_text, list of {page: 0, text: str}).
    """
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

        if not paragraphs:
            raise DocumentLoadError("DOCX tidak mengandung teks yang dapat diekstrak.")

        full_text = "\n".join(paragraphs)
        # DOCX doesn't have page numbers, use page=0
        pages_data = [{"page": 0, "text": full_text}]

        logger.info(f"DOCX loaded: {len(paragraphs)} paragraphs, {len(full_text)} chars")
        return full_text, pages_data

    except DocumentLoadError:
        raise
    except Exception as e:
        logger.error(f"Failed to load DOCX: {e}")
        raise DocumentLoadError(f"Gagal memproses DOCX: {str(e)}")


async def load_url(url: str) -> Tuple[str, List[dict]]:
    """
    Fetch URL and extract text content.
    Returns (full_text, list of {page: 0, text: str}).
    """
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script, style, nav, footer elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # Extract text from relevant tags
        texts = []
        for tag in soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li"]):
            text = tag.get_text(strip=True)
            if text:
                texts.append(text)

        if not texts:
            raise DocumentLoadError("URL tidak mengandung teks yang dapat diekstrak.")

        full_text = "\n".join(texts)
        pages_data = [{"page": 0, "text": full_text}]

        logger.info(f"URL loaded: {len(texts)} elements, {len(full_text)} chars")
        return full_text, pages_data

    except DocumentLoadError:
        raise
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch URL: {e}")
        raise DocumentLoadError(f"Gagal mengakses URL: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to load URL: {e}")
        raise DocumentLoadError(f"Gagal memproses URL: {str(e)}")
