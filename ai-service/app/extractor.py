import os
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, Any, List

try:
    import pymupdf as fitz
except ImportError:
    fitz = None

def extract_text_from_file(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Extracts text, page numbers, and structural sections from PDF, DOCX, or TXT files.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(original_filename.lower())[1]

    if ext == '.pdf':
        return _extract_from_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        return _extract_from_docx(file_path)
    elif ext == '.txt':
        return _extract_from_txt(file_path)
    else:
        # Fallback to plain text read
        return _extract_from_txt(file_path)

def _extract_from_pdf(file_path: str) -> Dict[str, Any]:
    pages: List[Dict[str, Any]] = []
    full_text = []

    if fitz:
        doc = fitz.open(file_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text("text").strip()
            pages.append({
                "page_number": page_idx + 1,
                "text": text,
                "char_count": len(text)
            })
            full_text.append(f"--- [Page {page_idx + 1}] ---\n{text}")
        doc.close()
    else:
        # Fallback if PyMuPDF not available
        with open(file_path, 'rb') as f:
            raw = f.read().decode('latin-1', errors='ignore')
            pages.append({"page_number": 1, "text": raw[:2000], "char_count": len(raw)})
            full_text.append(raw[:5000])

    combined_text = "\n\n".join(full_text)
    return {
        "text": combined_text,
        "page_count": len(pages),
        "pages": pages,
        "total_characters": len(combined_text)
    }

def _extract_from_docx(file_path: str) -> Dict[str, Any]:
    paragraphs = []
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            # w:t elements contain text in Word OpenXML
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            for p in tree.iterfind('.//w:p', namespaces):
                texts = [node.text for node in p.iterfind('.//w:t', namespaces) if node.text]
                if texts:
                    paragraphs.append("".join(texts))
    except Exception as e:
        # If binary .doc or corrupted, fallback
        with open(file_path, 'rb') as f:
            raw = f.read().decode('latin-1', errors='ignore')
            paragraphs.append(raw[:3000])

    combined_text = "\n".join(paragraphs)
    # Estimate pages based on word/character count (approx 2000 chars per page)
    est_pages = max(1, len(combined_text) // 2000)
    return {
        "text": combined_text,
        "page_count": est_pages,
        "pages": [{"page_number": 1, "text": combined_text, "char_count": len(combined_text)}],
        "total_characters": len(combined_text)
    }

def _extract_from_txt(file_path: str) -> Dict[str, Any]:
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    return {
        "text": text,
        "page_count": max(1, len(text) // 2000),
        "pages": [{"page_number": 1, "text": text, "char_count": len(text)}],
        "total_characters": len(text)
    }
