# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from routers import (
    summarizer,
    summarizer_v2,
    translator,
    drafter,
    assistant,
    search,
    judgment_search,
    smart_search,
    law_resolve,
)

load_dotenv()

app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",

        # Vercel
        "https://ptl.vercel.app",

        # Custom domain (VERY IMPORTANT)
        "https://www.pakistantoplawyers.com",
        "https://pakistantoplawyers.com",
    ],
    allow_origin_regex=r"https://ptl(-[a-z0-9]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/")
def read_root():
    return {"message": "PTL Backend is Active"}

@app.get("/api/health")
def health_check():
    return {"status": "success", "service": "PTL AI Engine"}

# Connect routers
app.include_router(summarizer.router)
app.include_router(summarizer_v2.router)
app.include_router(translator.router)
app.include_router(drafter.router)
app.include_router(assistant.router)
app.include_router(search.router)
app.include_router(judgment_search.router)
app.include_router(smart_search.router)
app.include_router(law_resolve.router)
