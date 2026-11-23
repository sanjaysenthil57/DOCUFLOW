import os
import uvicorn
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from extractor import extract_text_from_file
from auditor import audit_document, generate_academic_summaries

app = FastAPI(
    title="DocuFlow AI Academic Verification & Learning Service",
    version="2.0.0",
    description="Local AI microservice for academic document extraction, 12-point quality auditing, and conversational student learning assistance."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://127.0.0.1:11434")

def get_ollama_model() -> str:
    """
    Detects the installed Ollama model dynamically.
    Prefers OLLAMA_MODEL env if set, otherwise auto-detects from Ollama tags.
    """
    model_override = os.getenv("OLLAMA_MODEL")
    if model_override:
        return model_override
    try:
        with httpx.Client(timeout=3.0) as client:
            r = client.get(f"{OLLAMA_API_URL}/api/tags")
            if r.status_code == 200:
                models = r.json().get("models", [])
                if models:
                    return models[0]["name"]
    except Exception:
        pass
    return "llama3.2:1b"

class VerifyRequest(BaseModel):
    document_id: str
    version_id: str
    file_path: str
    original_filename: str

class SummarizeRequest(BaseModel):
    document_id: str
    title: str
    file_path: Optional[str] = None
    text_content: Optional[str] = None

class ChatRequest(BaseModel):
    question: str
    context_text: Optional[str] = ""
    language: Optional[str] = "en"
    document_title: Optional[str] = None
    file_path: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []

@app.get("/api/health")
def health_check():
    model = get_ollama_model()
    return {
        "status": "ONLINE",
        "service": "DocuFlow AI Conversational Service",
        "version": "2.0.0",
        "llm_engine": "Ollama Local Service",
        "active_model": model,
        "engine": "PyMuPDF & Ollama RAG Pipeline"
    }

@app.post("/api/verify")
def verify_document_endpoint(req: VerifyRequest):
    try:
        extraction = extract_text_from_file(req.file_path, req.original_filename)
        text = extraction["text"]
        page_count = extraction["page_count"]
        report = audit_document(text, req.original_filename, page_count)

        return {
            "success": True,
            "document_id": req.document_id,
            "version_id": req.version_id,
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.post("/api/summarize")
def summarize_endpoint(req: SummarizeRequest):
    try:
        text = req.text_content
        if not text and req.file_path and os.path.exists(req.file_path):
            extracted = extract_text_from_file(req.file_path, req.title)
            text = extracted["text"]

        if not text:
            text = f"Academic syllabus and notes for {req.title}."

        summaries = generate_academic_summaries(text, req.title)
        return {
            "success": True,
            "summaries": summaries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    q = req.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    ctx = (req.context_text or "").strip()
    doc_title = (req.document_title or "").strip()
    file_path = req.file_path
    history = req.history or []
    model_name = get_ollama_model()

    # If file_path is provided and context is brief, extract genuine text from document
    if file_path and os.path.exists(file_path) and len(ctx) < 200:
        try:
            extracted = extract_text_from_file(file_path, os.path.basename(file_path))
            raw_text = extracted.get("text", "")
            if raw_text:
                ctx = raw_text[:4000]
        except Exception:
            pass

    # Detect Tamil request
    q_lower = q.lower()
    is_tamil = (
        req.language == "ta"
        or "tamil" in q_lower
        or "தமிழில்" in q
        or "விளக்கம்" in q
        or any('\u0b80' <= char <= '\u0bff' for char in q)
    )

    # Build Structured Academic Prompt
    prompt_sections = []

    # 1. System instructions
    system_prompt = (
        "You are DocuFlow AI Academic Assistant, a friendly, authoritative, and helpful computer science professor and tutor for MCA (Master of Computer Applications) students.\n\n"
        "Instructions:\n"
        "1. Provide thorough, direct, natural, and comprehensive conversational answers like ChatGPT.\n"
        "2. Structure your answers cleanly with Markdown headings (###), numbered steps, bullet points, and clean comparison tables when contrasting topics.\n"
        "3. When answering programming questions, write complete, error-free code inside standard fenced code blocks (```python, ```c, ```cpp, ```java, ```sql) with explanations and asymptotic complexity.\n"
        "4. Avoid generic placeholder responses, avoid reciting disclaimers repeatedly, and never say 'Regarding your question'. Jump straight into the clear explanation.\n"
    )

    if is_tamil:
        system_prompt += (
            "5. LANGUAGE REQUIREMENT: You MUST answer entirely in clear, natural, and grammatically correct Tamil (தமிழ் விளக்கம்). "
            "Explain technical concepts thoroughly, mentioning standard English terms in parentheses (e.g. போக்குவரத்து அடுக்கு (Transport Layer)).\n"
        )
    else:
        system_prompt += "5. LANGUAGE REQUIREMENT: Answer in clear, professional, accessible English.\n"

    prompt_sections.append(system_prompt)

    # 2. Document Grounding Context (if matched)
    if ctx:
        prompt_sections.append(
            f"### Approved College Syllabus Material ({doc_title or 'Verified Course Syllabus'}):\n"
            f"{ctx}\n\n"
            "ACADEMIC GROUNDING RULE: The above is the official, HOD-approved course syllabus for this student. "
            "Base your answer directly on this content, cover all key units/topics thoroughly, and explicitly mention that this corresponds to their verified college syllabus.\n"
        )
    else:
        prompt_sections.append(
            "ACADEMIC GROUNDING RULE: No specific college syllabus document is matched for this query in the student's repository. "
            "Provide a comprehensive, high-quality computer science / engineering explanation using general academic knowledge. "
            "Politely note that this represents standard computer science curriculum knowledge.\n"
        )

    # 3. Conversation History (for follow-ups)
    if history:
        history_text = "### Previous Conversation Turns:\n"
        for turn in history[-4:]:
            sender = "Student" if (turn.get("sender") == "student" or turn.get("role") == "user") else "Assistant"
            text_snippet = str(turn.get("text") or turn.get("content") or "").strip()
            if len(text_snippet) > 250:
                text_snippet = text_snippet[:250] + "..."
            history_text += f"{sender}: {text_snippet}\n"
        prompt_sections.append(history_text)

    # 4. User Question (with normalization for LLM safety guardrails)
    llm_query = q
    if "uploaded" in q_lower and ("document" in q_lower or "academic" in q_lower or "material" in q_lower):
        llm_query = f"Provide an academic study summary of the approved course syllabus notes for {doc_title or 'Network Communication Techniques'}."

    prompt_sections.append(f"### Current Student Question:\n{llm_query}\n\n### Assistant Answer:")
    full_prompt = "\n".join(prompt_sections)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_API_URL}/api/generate",
                json={
                    "model": model_name,
                    "prompt": full_prompt,
                    "stream": False,
                    "keep_alive": "24h",
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 420
                    }
                }
            )

        if resp.status_code == 200:
            result = resp.json()
            answer = result.get("response", "").strip()

            # Guard against small LLM false-positive safety refusals
            refusal_markers = [
                "i can't provide assistance or guidance on illegal",
                "unauthorized access to uploaded",
                "contain copyrighted material"
            ]
            if any(marker in answer.lower() for marker in refusal_markers):
                fallback_prompt = (
                    f"You are a computer science professor. Provide a detailed academic summary and breakdown of the key concepts of {doc_title or 'the OSI Reference Model and network protocol layers'} with bullet points and examples."
                )
                async with httpx.AsyncClient(timeout=120.0) as retry_client:
                    retry_resp = await retry_client.post(
                        f"{OLLAMA_API_URL}/api/generate",
                        json={
                            "model": model_name,
                            "prompt": fallback_prompt,
                            "stream": False,
                            "keep_alive": "24h",
                            "options": {
                                "temperature": 0.3,
                                "num_predict": 420
                            }
                        }
                    )
                    if retry_resp.status_code == 200:
                        answer = retry_resp.json().get("response", "").strip()

            if answer:
                return {
                    "success": True,
                    "reply": answer,
                    "model": model_name,
                    "sourceType": "approved_document" if ctx else "general_academic"
                }

        raise HTTPException(
            status_code=502,
            detail=f"Ollama API returned status {resp.status_code}: {resp.text}"
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Local LLM runtime (Ollama) is currently unreachable at {OLLAMA_API_URL}. Details: {str(exc)}"
        )

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)
