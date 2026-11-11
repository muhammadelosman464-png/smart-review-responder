"""
Smart Review Responder — FastAPI Backend
Production-Ready, Zero-Vulnerability API.
High-Precision, Dynamic & Context-Aware AI Review Responses.
"""

import json
import os
import re
from contextlib import asynccontextmanager

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Validation check for environment variables
for name, val in {
    "SUPABASE_URL": SUPABASE_URL,
    "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_SERVICE_ROLE_KEY,
    "GEMINI_API_KEY": GEMINI_API_KEY,
    "INTERNAL_API_SECRET": INTERNAL_API_SECRET,
}.items():
    if not val:
        raise RuntimeError(f"Missing required environment variable: {name}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[BACKEND] Smart Review Responder backend is running on http://127.0.0.1:8000")
    yield
    print("[BACKEND] Shutting down...")


app = FastAPI(
    title="Smart Review Responder API",
    version="1.0.0",
    description="Micro SaaS Backend for Dynamic AI Review Processing",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Security Dependency ───────────────────────────────────────
async def verify_internal_secret(
    x_internal_secret: str | None = Header(None, alias="X-Internal-Secret"),
):
    if not x_internal_secret or x_internal_secret != INTERNAL_API_SECRET:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid or missing X-Internal-Secret header.",
        )


# ── Request / Response Models ─────────────────────────────────
class ReviewIn(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=200)
    rating: int = Field(..., ge=1, le=5)
    review_text: str = Field(..., min_length=1, max_length=5000)

    @field_validator("customer_name", "review_text")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class ReviewResponse(BaseModel):
    success: bool
    message: str
    data: dict | None = None


# ── Dynamic Gemini AI Processor ───────────────────────────────
async def call_gemini(customer_name: str, review_text: str, rating: int) -> dict:
    """
    Calls Google Gemini to generate a highly dynamic, context-aware,
    empathetic Arabic reply tailored specifically to the customer's text.
    """
    prompt = f"""You are a professional restaurant and hospitality general manager with exceptional communication skills.
Analyze this customer review and generate an intelligent, highly personalized, and empathetic reply in natural Arabic.

CUSTOMER REVIEW DETAILS:
- Customer Name: "{customer_name}"
- Rating: {rating} / 5 stars
- Review Content: "{review_text}"

STRICT INSTRUCTIONS:
1. GREETING: Address the customer politely by name in Arabic (e.g., "أهلاً بك أستاذ {customer_name}" or "مرحباً بكِ أستاذة {customer_name}").
2. CONTEXT-AWARE & HYPER-SPECIFIC (NO GENERIC REPLIES):
   - You MUST read the specific review text and explicitly mention the exact items, staff, or situations they commented on.
   - If they complained about cold food, late driver, missing sauce, high price, or dry meat: specifically apologize for that exact cold food, the late delivery, or the exact missing item.
   - If they praised a specific dish (e.g., burger, pizza, pasta), fast service, friendly cashier, or ambiance: thank them specifically for highlighting that exact dish or experience and express genuine enthusiasm.
   - Do NOT use generic canned apologies or repetitive boilerplate templates.
3. TONE & SENTIMENT:
   - Ratings 1 to 3 stars: Sincere empathy, accountability, and an actionable offer to make things right.
   - Ratings 4 to 5 stars: Warm gratitude, delight in their satisfaction, and an invitation to return.
4. LANGUAGE: Natural, elegant, modern business Arabic (فصحى معاصرة ولبقة).
5. OUTPUT FORMAT: Output ONLY a valid JSON object without markdown code blocks, backticks, or extra text:
{{"reply": "Your custom Arabic reply here", "status": "positive or negative"}}

Ensure status is exactly "positive" for ratings 4-5 and "negative" for ratings 1-3.
"""

    models_to_try = ["gemini-3.6-flash", "gemini-3.1-flash-lite"]
    last_error: Exception | None = None

    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1024,
                },
            }
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text)
                        cleaned = re.sub(r"\s*```$", "", cleaned).strip()

                        try:
                            parsed = json.loads(cleaned)
                        except json.JSONDecodeError:
                            match = re.search(r'\{[^{}]*"reply"\s*:\s*".*?"[^{}]*\}', cleaned, re.DOTALL)
                            if match:
                                parsed = json.loads(match.group())
                            else:
                                raise ValueError(f"Could not parse valid JSON from Gemini response: {cleaned[:200]}")

                        status = parsed.get("status", "").lower()
                        if status not in ("positive", "negative"):
                            status = "positive" if rating >= 4 else "negative"

                        return {
                            "reply": parsed.get("reply", "").strip(),
                            "status": status,
                        }
                else:
                    last_error = RuntimeError(f"Gemini model {model} returned HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                last_error = e
                continue

    raise HTTPException(
        status_code=502,
        detail=f"AI generation failed across all available Gemini models: {str(last_error)}",
    )


# ── Supabase Service Role Storage ─────────────────────────────
async def insert_review_to_supabase(record: dict) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/customer_reviews"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, headers=headers, json=record)
        if resp.status_code >= 400:
            raise RuntimeError(f"Supabase DB error ({resp.status_code}): {resp.text}")
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        return record


# ── Endpoints ─────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Smart Review Responder Backend"}


@app.post("/process-review", response_model=ReviewResponse)
async def process_review(
    body: ReviewIn,
    _=Depends(verify_internal_secret),
):
    try:
        # Generate 100% dynamic, context-aware AI reply
        ai_result = await call_gemini(
            customer_name=body.customer_name,
            review_text=body.review_text,
            rating=body.rating,
        )

        record = {
            "customer_name": body.customer_name,
            "rating": body.rating,
            "review_text": body.review_text,
            "ai_reply": ai_result["reply"],
            "status": ai_result["status"],
        }

        saved_data = await insert_review_to_supabase(record)

        return ReviewResponse(
            success=True,
            message="Review processed and saved successfully.",
            data=saved_data,
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"❌ Server error: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing review: {str(exc)}",
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

