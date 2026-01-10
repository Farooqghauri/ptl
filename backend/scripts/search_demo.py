"""
Legal Search Demo - Test Your Supreme Court Database
Run this after scraping to try different search methods
"""

import os
import sys
import sqlite3
import pickle
import numpy as np
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

# Configuration
current_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(current_dir, "../data")
DB_PATH = os.path.join(DATA_DIR, "legal_db.sqlite")
ENV_PATH = os.path.join(current_dir, "../.env")

load_dotenv(ENV_PATH)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


# --- SEARCH FUNCTIONS ---
def search_keyword(query: str, limit: int = 5) -> List[Dict]:
    """Basic keyword search using FTS5"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        cur.execute("""
                    SELECT j.id,
                           j.title,
                           j.citation,
                           j.summary,
                           snippet(judgments_fts, 1, '→', '←', '...', 80) as context
                    FROM judgments_fts
                             JOIN judgments j ON judgments_fts.rowid = j.id
                    WHERE judgments_fts MATCH ?
                    ORDER BY rank LIMIT ?
                    """, (query, limit))

        results = []
        for row in cur.fetchall():
            results.append({
                'id': row[0], 'title': row[1], 'citation': row[2],
                'summary': row[3], 'context': row[4]
            })
        return results
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return []
    finally:
        conn.close()


def search_semantic(query: str, limit: int = 5) -> List[Dict]:
    """AI-powered semantic search"""
    if not openai_client:
        print("❌ OpenAI API key not configured")
        return []

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        # Generate query embedding
        response = openai_client.embeddings.create(
            input=query,
            model="text-embedding-3-small"
        )
        query_vector = np.array(response.data[0].embedding, dtype=np.float32)

        # Get all documents
        cur.execute("SELECT id, title, citation, summary, embedding FROM judgments WHERE embedding IS NOT NULL")

        similarities = []
        for row in cur.fetchall():
            doc_id, title, citation, summary, emb_blob = row
            doc_vector = pickle.loads(emb_blob)

            # Cosine similarity
            dot_product = np.dot(query_vector, doc_vector)
            norm = np.linalg.norm(query_vector) * np.linalg.norm(doc_vector)
            similarity = dot_product / norm if norm > 0 else 0

            similarities.append((similarity, doc_id, title, citation, summary))

        similarities.sort(reverse=True, key=lambda x: x[0])

        results = []
        for sim, doc_id, title, citation, summary in similarities[:limit]:
            results.append({
                'id': doc_id, 'title': title, 'citation': citation,
                'summary': summary, 'similarity': f"{sim * 100:.1f}%"
            })
        return results

    except Exception as e:
        print(f"❌ Semantic search failed: {e}")
        return []
    finally:
        conn.close()


# --- INTERACTIVE DEMO ---
def interactive_search():
    print("\n" + "=" * 80)
    print("🏛️  SUPREME COURT OF PAKISTAN - LEGAL SEARCH DEMO")
    print("=" * 80)

    if not os.path.exists(DB_PATH):
        print("\n❌ Database not found. Run the scraper first!")
        return

    while True:
        user_input = input("\n🔍 Enter (keyword/semantic) 'query' or 'quit': ").strip()
        if user_input.lower() == 'quit': break

        parts = user_input.split(maxsplit=1)
        if len(parts) < 2: continue

        cmd, query = parts[0], parts[1]

        if cmd == 'keyword':
            results = search_keyword(query)
            for r in results: print(f"📄 {r['citation']}: {r['title']}\n   Context: {r['context']}\n")
        elif cmd == 'semantic':
            results = search_semantic(query)
            for r in results: print(f"🤖 {r['similarity']} Match | {r['citation']}: {r['title']}")


if __name__ == "__main__":
    interactive_search()