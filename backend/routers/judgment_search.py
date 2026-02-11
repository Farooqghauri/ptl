"""
Legal Search API Router - Full Version
=======================================
FastAPI router for legal judgment search.
Matched to PTL Database Schema.

Your database columns:
- id, title, citation, judgment_date, pdf_url, pdf_hash,
- full_text, summary, embedding, created_at, updated_at

Endpoints:
- POST /api/search/keyword - Keyword search using FTS5
- POST /api/search/semantic - AI semantic search using embeddings
- GET /api/search/citation/{citation} - Lookup by citation
- GET /api/search/recent - Get recent judgments
- GET /api/search/stats - Database statistics
- GET /api/search/judgment/{id} - Get full judgment details
"""

import os
import logging
import sqlite3
import pickle
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

# NumPy for vector operations
try:
    import numpy as np

    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

# OpenAI for semantic search
try:
    from openai import OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# CONFIGURATION
# =============================================================================

router = APIRouter(prefix="/api/search", tags=["search"])
logger = logging.getLogger(__name__)

# Database path - adjust based on your project structure
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, '..', 'data', 'legal_db.sqlite')

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# =============================================================================
# PYDANTIC MODELS (Request/Response schemas)
# =============================================================================

class KeywordSearchRequest(BaseModel):
    """Request model for keyword search."""
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    limit: int = Field(20, ge=1, le=100, description="Maximum results to return")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "bail murder",
                "limit": 20
            }
        }


class SemanticSearchRequest(BaseModel):
    """Request model for semantic/AI search."""
    query: str = Field(..., min_length=3, max_length=1000, description="Natural language query")
    limit: int = Field(10, ge=1, le=50, description="Maximum results to return")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "can police arrest someone without a warrant",
                "limit": 10
            }
        }


class JudgmentSummary(BaseModel):
    """Summary model for judgment in search results."""
    id: int
    title: str
    citation: Optional[str] = None
    summary: Optional[str] = None
    pdf_url: str
    judgment_date: Optional[str] = None
    created_at: Optional[str] = None
    relevance_score: Optional[float] = None


class JudgmentFull(BaseModel):
    """Full judgment model with all details."""
    id: int
    title: str
    citation: Optional[str] = None
    summary: Optional[str] = None
    full_text: Optional[str] = None
    pdf_url: str
    pdf_hash: Optional[str] = None
    judgment_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SearchResponse(BaseModel):
    """Standard search response model."""
    success: bool
    query: str
    total_results: int
    results: List[JudgmentSummary]
    search_type: str


class StatsResponse(BaseModel):
    """Database statistics response model."""
    total_judgments: int
    with_embeddings: int
    with_full_text: int
    last_updated: Optional[str] = None
    database_path: str


# =============================================================================
# DATABASE HELPERS
# =============================================================================

def get_db_connection() -> sqlite3.Connection:
    """
    Get database connection with row factory.
    Raises HTTPException if database not found.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(
            status_code=500,
            detail="Database not found. Please run the scraper first."
        )

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_judgment_summary(row: sqlite3.Row, score: float = None) -> JudgmentSummary:
    """Convert database row to JudgmentSummary model."""
    return JudgmentSummary(
        id=row['id'],
        title=row['title'],
        citation=row['citation'],
        summary=row['summary'],
        pdf_url=row['pdf_url'],
        judgment_date=row['judgment_date'] if 'judgment_date' in row.keys() else None,
        created_at=row['created_at'] if 'created_at' in row.keys() else None,
        relevance_score=score
    )


def row_to_judgment_full(row: sqlite3.Row) -> JudgmentFull:
    """Convert database row to JudgmentFull model."""
    return JudgmentFull(
        id=row['id'],
        title=row['title'],
        citation=row['citation'],
        summary=row['summary'],
        full_text=row['full_text'],
        pdf_url=row['pdf_url'],
        pdf_hash=row['pdf_hash'] if 'pdf_hash' in row.keys() else None,
        judgment_date=row['judgment_date'] if 'judgment_date' in row.keys() else None,
        created_at=row['created_at'] if 'created_at' in row.keys() else None,
        updated_at=row['updated_at'] if 'updated_at' in row.keys() else None
    )


# =============================================================================
# EMBEDDING FUNCTIONS
# =============================================================================

def generate_query_embedding(query: str) -> Optional[List[float]]:
    """
    Generate embedding vector for search query using OpenAI.
    Returns None if OpenAI is not available or fails.
    """
    if not OPENAI_AVAILABLE:
        return None

    if not OPENAI_API_KEY:
        return None

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.embeddings.create(
            input=query,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        logging.getLogger(__name__).error("Embedding generation failed: %s", e)
        return None


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite).
    """
    if not NUMPY_AVAILABLE:
        # Fallback without numpy (slower)
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    a = np.array(a)
    b = np.array(b)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get database statistics.

    Returns:
    - total_judgments: Total number of judgments in database
    - with_embeddings: Number of judgments with AI embeddings
    - with_full_text: Number of judgments with extracted text
    - last_updated: Timestamp of most recent judgment
    - database_path: Path to the database file
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Total judgments
        cur.execute("SELECT COUNT(*) as count FROM judgments")
        total = cur.fetchone()['count']

        # With embeddings
        cur.execute("SELECT COUNT(*) as count FROM judgments WHERE embedding IS NOT NULL")
        with_embeddings = cur.fetchone()['count']

        # With full text
        cur.execute("SELECT COUNT(*) as count FROM judgments WHERE full_text IS NOT NULL AND full_text != ''")
        with_full_text = cur.fetchone()['count']

        # Last updated
        cur.execute("SELECT MAX(created_at) as last FROM judgments")
        result = cur.fetchone()
        last_updated = result['last'] if result else None

        return StatsResponse(
            total_judgments=total,
            with_embeddings=with_embeddings,
            with_full_text=with_full_text,
            last_updated=last_updated,
            database_path=DB_PATH
        )

    finally:
        conn.close()


@router.get("/recent", response_model=SearchResponse)
async def recent_judgments(
        limit: int = Query(20, ge=1, le=100, description="Number of results to return")
):
    """
    Get most recently added judgments.

    Parameters:
    - limit: Maximum number of results (default 20, max 100)

    Returns:
    - List of recent judgments ordered by created_at descending
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
                    SELECT id, title, citation, summary, pdf_url, judgment_date, created_at
                    FROM judgments
                    ORDER BY created_at DESC LIMIT ?
                    """, (limit,))

        rows = cur.fetchall()
        results = [row_to_judgment_summary(row) for row in rows]

        return SearchResponse(
            success=True,
            query="recent",
            total_results=len(results),
            results=results,
            search_type="recent"
        )

    finally:
        conn.close()


@router.post("/keyword", response_model=SearchResponse)
async def keyword_search(request: KeywordSearchRequest):
    """
    Full-text keyword search using SQLite FTS5.

    Searches across title, citation, full_text, and summary fields.
    Uses AND logic for multiple words (e.g., "bail murder" finds documents with BOTH words).

    Request body:
    - query: Search keywords (required)
    - limit: Maximum results (default 20)

    Example:
    ```json
    {
        "query": "bail murder",
        "limit": 20
    }
    ```
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Build FTS5 query - convert "bail murder" to "bail AND murder"
        search_terms = request.query.strip().split()
        fts_query = ' AND '.join(search_terms)

        # Try FTS5 search first
        try:
            cur.execute("""
                        SELECT j.id,
                               j.title,
                               j.citation,
                               j.summary,
                               j.pdf_url,
                               j.judgment_date,
                               j.created_at,
                               bm25(judgments_fts) as rank
                        FROM judgments_fts
                                 JOIN judgments j ON judgments_fts.rowid = j.id
                        WHERE judgments_fts MATCH ?
                        ORDER BY rank LIMIT ?
                        """, (fts_query, request.limit))

            rows = cur.fetchall()
            results = [row_to_judgment_summary(row, score=abs(row['rank'])) for row in rows]

        except sqlite3.OperationalError as e:
            # FTS5 not available or query syntax error - fallback to LIKE search
            logger.warning("FTS5 search failed, using LIKE fallback: %s", e)

            like_pattern = f'%{request.query}%'
            cur.execute("""
                        SELECT id, title, citation, summary, pdf_url, judgment_date, created_at
                        FROM judgments
                        WHERE title LIKE ?
                           OR full_text LIKE ?
                           OR citation LIKE ?
                           OR summary LIKE ? LIMIT ?
                        """, (like_pattern, like_pattern, like_pattern, like_pattern, request.limit))

            rows = cur.fetchall()
            results = [row_to_judgment_summary(row) for row in rows]

        return SearchResponse(
            success=True,
            query=request.query,
            total_results=len(results),
            results=results,
            search_type="keyword"
        )

    except Exception as e:
        logger.exception("Keyword search failed: %s", e)
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")

    finally:
        conn.close()


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    """
    AI-powered semantic search using OpenAI embeddings.

    Finds conceptually similar judgments even without exact keyword matches.
    Uses cosine similarity to compare query embedding with stored document embeddings.

    Requirements:
    - OPENAI_API_KEY environment variable must be set
    - Judgments must have embeddings generated (run scraper with OpenAI key)

    Request body:
    - query: Natural language question (required, min 3 chars)
    - limit: Maximum results (default 10)

    Example:
    ```json
    {
        "query": "can police arrest someone without a warrant",
        "limit": 10
    }
    ```
    """
    # Check prerequisites
    if not OPENAI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Semantic search requires OpenAI library. Install with: pip install openai"
        )

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Semantic search requires OpenAI API key. Set OPENAI_API_KEY in your .env file"
        )

    if not NUMPY_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Semantic search requires numpy. Install with: pip install numpy"
        )

    # Generate query embedding
    query_embedding = generate_query_embedding(request.query)
    if not query_embedding:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate query embedding. Check your OpenAI API key."
        )

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Get all judgments with embeddings
        cur.execute("""
                    SELECT id,
                           title,
                           citation,
                           summary,
                           pdf_url,
                           judgment_date,
                           created_at,
                           embedding
                    FROM judgments
                    WHERE embedding IS NOT NULL
                    """)

        rows = cur.fetchall()

        if not rows:
            return SearchResponse(
                success=True,
                query=request.query,
                total_results=0,
                results=[],
                search_type="semantic"
            )

        # Calculate similarity scores for each judgment
        scored_results = []
        for row in rows:
            try:
                # Unpickle the stored embedding
                doc_embedding = pickle.loads(row['embedding'])

                # Calculate cosine similarity
                score = cosine_similarity(query_embedding, doc_embedding)
                scored_results.append((row, score))
            except Exception as e:
                # Skip documents with corrupted embeddings
                logging.getLogger(__name__).warning("Error processing embedding for judgment %s: %s", row['id'], e)
                continue

        # Sort by similarity score (highest first)
        scored_results.sort(key=lambda x: x[1], reverse=True)

        # Take top N results
        top_results = scored_results[:request.limit]

        # Convert to response format
        results = [
            JudgmentSummary(
                id=row['id'],
                title=row['title'],
                citation=row['citation'],
                summary=row['summary'],
                pdf_url=row['pdf_url'],
                judgment_date=row['judgment_date'],
                created_at=row['created_at'],
                relevance_score=round(score, 4)
            )
            for row, score in top_results
        ]

        return SearchResponse(
            success=True,
            query=request.query,
            total_results=len(results),
            results=results,
            search_type="semantic"
        )

    finally:
        conn.close()


@router.get("/citation/{citation}", response_model=SearchResponse)
async def citation_lookup(citation: str):
    """
    Look up judgment by legal citation.

    Searches for exact or partial citation matches.

    Parameters:
    - citation: Legal citation to search for (e.g., "PLD 2024 SC 1276")

    Example URLs:
    - /api/search/citation/PLD%202024%20SC%201276
    - /api/search/citation/2024%20SCMR
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Search for exact or partial match
        cur.execute("""
                    SELECT id, title, citation, summary, pdf_url, judgment_date, created_at
                    FROM judgments
                    WHERE citation = ?
                       OR citation LIKE ? LIMIT 20
                    """, (citation, f'%{citation}%'))

        rows = cur.fetchall()
        results = [row_to_judgment_summary(row) for row in rows]

        return SearchResponse(
            success=True,
            query=citation,
            total_results=len(results),
            results=results,
            search_type="citation"
        )

    finally:
        conn.close()


@router.get("/judgment/{judgment_id}")
async def get_judgment(judgment_id: int):
    """
    Get full judgment details by ID.

    Returns complete judgment including full_text (which is excluded from search results for performance).

    Parameters:
    - judgment_id: Unique identifier of the judgment

    Returns:
    - Full judgment object with all fields including full_text
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM judgments WHERE id = ?", (judgment_id,))
        row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Judgment with ID {judgment_id} not found")

        judgment = row_to_judgment_full(row)

        return {
            "success": True,
            "judgment": judgment.model_dump()
        }

    finally:
        conn.close()


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the search service.

    Returns:
    - status: "healthy" if database is accessible
    - database: Connection status
    - features: Available features (FTS5, semantic search)
    """
    health = {
        "status": "healthy",
        "database": "unknown",
        "features": {
            "fts5": False,
            "semantic_search": OPENAI_AVAILABLE and bool(OPENAI_API_KEY),
            "numpy": NUMPY_AVAILABLE
        }
    }

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check database connection
        cur.execute("SELECT COUNT(*) FROM judgments")
        count = cur.fetchone()[0]
        health["database"] = f"connected ({count} judgments)"

        # Check FTS5
        try:
            cur.execute("SELECT * FROM judgments_fts LIMIT 1")
            health["features"]["fts5"] = True
        except sqlite3.OperationalError:
            health["features"]["fts5"] = False

        conn.close()

    except Exception as e:
        health["status"] = "unhealthy"
        health["database"] = f"error: {str(e)}"

    return health
