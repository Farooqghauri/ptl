import os
import logging
from functools import lru_cache

import pandas as pd
from fastapi import APIRouter
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None

router = APIRouter()
logger = logging.getLogger(__name__)

# PATHS
STATUTES_PATH = os.path.join(os.path.dirname(__file__), "../data/statutes.csv")
JUDGMENTS_PATH = os.path.join(os.path.dirname(__file__), "../data/judgments.csv")


@lru_cache(maxsize=1)
def _load_statutes() -> pd.DataFrame:
    if not os.path.exists(STATUTES_PATH):
        return pd.DataFrame()
    try:
        df = pd.read_csv(STATUTES_PATH)
        for col in ['section', 'keywords', 'text', 'statute']:
            df[col] = df[col].fillna("").astype(str)
        df['search_text'] = (df['section'] + " " + df['keywords'] + " " + df['text']).str.lower()
        return df
    except (FileNotFoundError, pd.errors.ParserError, ValueError) as e:
        logger.error("Failed to load statutes CSV: %s", e)
        return pd.DataFrame()


@lru_cache(maxsize=1)
def _load_judgments() -> pd.DataFrame:
    if not os.path.exists(JUDGMENTS_PATH):
        return pd.DataFrame()
    try:
        df = pd.read_csv(JUDGMENTS_PATH)
        for col in ['title', 'summary', 'citation']:
            df[col] = df[col].fillna("").astype(str)
        df['search_text'] = (df['title'] + " " + df['summary']).str.lower()
        return df
    except (FileNotFoundError, pd.errors.ParserError, ValueError) as e:
        logger.error("Failed to load judgments CSV: %s", e)
        return pd.DataFrame()


def smart_search(df: pd.DataFrame, query: str) -> pd.DataFrame:
    if df is None or df.empty: return pd.DataFrame()

    # 1. Clean the Query
    STOP_WORDS = {'is', 'the', 'in', 'of', 'to', 'for', 'a', 'an', 'what', 'give', 'me', 'refer', 'refers'}
    raw_words = query.lower().split()
    keywords = [w for w in raw_words if w not in STOP_WORDS]

    if not keywords: return pd.DataFrame()

    # 2. STRICT NUMBER RULE
    mandatory_numbers = [w for w in keywords if any(char.isdigit() for char in w)]

    # Start with all data
    results = df.copy()

    # Apply strict filtering for numbers
    if mandatory_numbers:
        for num in mandatory_numbers:
            results = results[results['search_text'].str.contains(num, regex=False, na=False)]

    # 3. Score remaining results based on other keywords
    results['score'] = 0
    for word in keywords:
        results.loc[results['search_text'].str.contains(word, regex=False, na=False), 'score'] += 1

    # Return top 3 matches
    return results[results['score'] > 0].sort_values(by='score', ascending=False).head(3)


@router.get("/api/search-engine")
async def legal_search(query: str):
    statutes_db = _load_statutes()
    judgments_db = _load_judgments()
    context_results = []

    # --- LAYER 1: STATUTES ---
    matches = smart_search(statutes_db, query)
    for _, row in matches.iterrows():
        context_results.append(f"STATUTE: {row['statute']} Section {row['section']} - {row['text']}")

    # --- LAYER 2: JUDGMENTS ---
    matches = smart_search(judgments_db, query)
    for _, row in matches.iterrows():
        summary_snippet = row['summary'][:300].replace("\n", " ")
        context_results.append(f"PRECEDENT: {row['title']} ({row['citation']})\nRuling: {summary_snippet}...")

    # --- LAYER 3: AI ANSWER ---
    if not context_results:
        return {"response": "No direct matches found. Try specific keywords like 'Murder', 'Bail', or 'Tax'.",
                "sources": []}

    context_str = "\n\n".join(context_results)

    if client is None:
        return {"response": "API Key missing. Here are the search results.", "sources": context_results}

    system_prompt = f"""
    You are PTL AI. Answer the user's legal question using ONLY the provided context.

    === LEGAL DATA ===
    {context_str}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": query}],
            temperature=0.1,
            timeout=30,
        )
        response_text = completion.choices[0].message.content
    except Exception as e:
        logger.error("AI search failed", exc_info=True)
        response_text = "AI Service is temporarily unavailable. Please try again."

    return {
        "response": response_text,
        "sources": context_results
    }
