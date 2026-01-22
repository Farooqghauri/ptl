from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import your routers - ADD smart_search here
from routers import summarizer, translator, drafter, assistant, search, judgment_search, smart_search, law_resolve

load_dotenv()

app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ptl.onrender.com",
        "https://ptl.vercel.app",   # default Vercel domain
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "PTL Backend is Active"}

@app.get("/api/health")
def health_check():
    return {"status": "success", "service": "PTL AI Engine"}

# Connect the tools
app.include_router(summarizer.router)
app.include_router(translator.router)
app.include_router(drafter.router)
app.include_router(assistant.router)
app.include_router(search.router)
app.include_router(judgment_search.router)
# app.include_router(law_search.router)
app.include_router(smart_search.router)

app.include_router(law_resolve.router)