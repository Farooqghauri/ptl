"""
PakLII Scraper - Pakistan Legal Information Institute
✅ No bot protection
✅ Well-structured HTML
✅ Reliable and maintained
✅ Has Supreme Court + High Courts
"""

import os
import sys
import hashlib
import logging
import pickle
import time
import re
import sqlite3
import numpy as np
from typing import List, Dict, Optional
from urllib.parse import urljoin

sys.stdout.reconfigure(encoding='utf-8')

import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv

# Config
current_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(current_dir, "../data")
DB_PATH = os.path.join(DATA_DIR, "legal_db.sqlite")
ENV_PATH = os.path.join(current_dir, "../.env")

load_dotenv(ENV_PATH)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# PakLII URLs
PAKLII_SUPREME_COURT = "https://www.pakistanlii.org/pk/cases/PKSC/"
PAKLII_RECENT = "https://www.pakistanlii.org/pk/recent.html"

HEADERS = {
    "User-Agent": "LegalAI Research Bot - Educational Purpose"
}

# Logging
os.makedirs(DATA_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(DATA_DIR, 'paklii_scraper.log'), encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


# --- DATABASE ---
def init_database():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
                CREATE TABLE IF NOT EXISTS judgments
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY
                    AUTOINCREMENT,
                    title
                    TEXT
                    NOT
                    NULL,
                    citation
                    TEXT,
                    pdf_url
                    TEXT,
                    web_url
                    TEXT
                    UNIQUE
                    NOT
                    NULL,
                    pdf_hash
                    TEXT,
                    full_text
                    TEXT,
                    summary
                    TEXT,
                    embedding
                    BLOB,
                    court
                    TEXT,
                    judge
                    TEXT,
                    decision_date
                    DATE,
                    created_at
                    TIMESTAMP
                    DEFAULT
                    CURRENT_TIMESTAMP
                );
                """)

    try:
        cur.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS judgments_fts 
            USING fts5(title, full_text, citation, content='judgments', content_rowid='id');
        """)
        cur.execute("""
                    CREATE TRIGGER IF NOT EXISTS judgments_fts_insert AFTER INSERT ON judgments
                    BEGIN
                INSERT INTO judgments_fts(rowid, title, full_text, citation) 
                VALUES (new.id, new.title, new.full_text, new.citation);
                    END;
                    """)
        logger.info("✅ Database ready")
    except:
        pass

    conn.commit()
    return conn


# --- PAKLII SCRAPING ---
def scrape_paklii_recent() -> List[Dict]:
    """Scrape recent Supreme Court cases from PakLII"""
    logger.info("🔍 Fetching from PakLII...")

    try:
        response = requests.get(PAKLII_RECENT, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"❌ Failed to connect: {e}")
        return []

    soup = BeautifulSoup(response.text, 'lxml')
    cases = []

    # PakLII lists cases in tables
    for link in soup.find_all('a', href=True):
        href = link['href']

        # Filter for Supreme Court cases
        if '/pk/cases/PKSC/' in href or 'supreme' in href.lower():
            full_url = urljoin(PAKLII_RECENT, href)
            title = link.get_text(strip=True)

            if title and len(title) > 10:
                cases.append({
                    'url': full_url,
                    'title': title
                })

    logger.info(f"✅ Found {len(cases)} Supreme Court cases")
    return cases


def scrape_paklii_by_year(year: int) -> List[Dict]:
    """Scrape cases from specific year"""
    url = f"{PAKLII_SUPREME_COURT}{year}/"
    logger.info(f"🔍 Scraping year {year}...")

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except:
        return []

    soup = BeautifulSoup(response.text, 'lxml')
    cases = []

    for link in soup.find_all('a', href=True):
        href = link['href']
        if href.endswith('.html') and year in href:
            full_url = urljoin(url, href)
            title = link.get_text(strip=True)
            cases.append({'url': full_url, 'title': title})

    logger.info(f"   Found {len(cases)} cases")
    return cases


def extract_case_details(url: str) -> Optional[Dict]:
    """Extract full judgment text from PakLII case page"""

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"   Failed to fetch: {e}")
        return None

    soup = BeautifulSoup(response.text, 'lxml')

    # PakLII has structured case pages
    title = ""
    citation = ""
    full_text = ""
    court = "Supreme Court of Pakistan"
    judge = ""
    date = ""

    # Extract title
    title_tag = soup.find('h1')
    if title_tag:
        title = title_tag.get_text(strip=True)

    # Extract citation
    cite_tag = soup.find('p', class_='cite') or soup.find(text=re.compile(r'PLD|SCMR'))
    if cite_tag:
        citation = str(cite_tag).strip()

    # Extract full text
    # PakLII usually has judgment in div with class 'judgment' or main content
    content_div = soup.find('div', class_='judgment') or soup.find('div', id='content')

    if content_div:
        # Remove script and style tags
        for tag in content_div(['script', 'style', 'nav', 'header', 'footer']):
            tag.decompose()

        full_text = content_div.get_text(separator='\n', strip=True)
    else:
        # Fallback: get all paragraph text
        paragraphs = soup.find_all('p')
        full_text = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50])

    # Extract judge name
    judge_match = re.search(r'(J\.|Justice|Hon\'ble)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', full_text[:1000])
    if judge_match:
        judge = judge_match.group(2)

    # Extract date
    date_match = re.search(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b', full_text[:500])
    if date_match:
        date = date_match.group(1)

    if not full_text or len(full_text) < 500:
        return None

    return {
        'title': title or "Untitled Judgment",
        'citation': citation or extract_citation_from_text(full_text),
        'full_text': full_text,
        'court': court,
        'judge': judge,
        'date': date,
        'web_url': url
    }


def extract_citation_from_text(text: str) -> str:
    """Extract citation from text"""
    patterns = [
        r'(PLD\s+\d{4}\s+\w+\s+\d+)',
        r'(SCMR\s+\d{4}\s+\d+)',
        r'(\d{4}\s+SCMR\s+\d+)',
        r'(YLR\s+\d{4}\s+\w+\s+\d+)'
    ]

    for pattern in patterns:
        if match := re.search(pattern, text, re.IGNORECASE):
            return match.group(1).upper()

    return "Unreported"


def generate_embeddings_batch(texts: List[str]) -> List[Optional[bytes]]:
    if not openai_client:
        return [None] * len(texts)

    try:
        clean = [t[:30000] for t in texts]
        res = openai_client.embeddings.create(input=clean, model="text-embedding-3-small")
        return [pickle.dumps(np.array(d.embedding, dtype=np.float32)) for d in res.data]
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return [None] * len(texts)


# --- PROCESSING ---
def process_cases(conn, cases: List[Dict]):
    """Process case list"""

    pending = []
    new_count = 0
    skip_count = 0

    for idx, case in enumerate(cases, 1):
        url = case['url']

        logger.info(f"\n[{idx}/{len(cases)}] {case['title'][:50]}...")

        # Check existing
        cur = conn.cursor()
        if cur.execute("SELECT id FROM judgments WHERE web_url = ?", (url,)).fetchone():
            logger.info("   ⏭️  Already exists")
            skip_count += 1
            continue

        # Extract details
        details = extract_case_details(url)

        if not details:
            logger.warning("   ⚠️  Extraction failed")
            continue

        # Generate summary
        summary = details['full_text'][:500] + "..."

        pending.append({
            **details,
            'summary': summary
        })

        logger.info(f"   ✅ {details['citation']}")
        new_count += 1

        if len(pending) >= 10:
            save_batch(conn, pending)
            pending = []

        time.sleep(2)  # Be respectful

    if pending:
        save_batch(conn, pending)

    print(f"\n{'=' * 70}")
    print(f"✅ Added: {new_count} | ⏭️  Skipped: {skip_count}")
    print(f"{'=' * 70}\n")


def save_batch(conn, batch: List[Dict]):
    logger.info(f"💾 Saving {len(batch)}...")

    texts = [x['full_text'] for x in batch]
    embeddings = generate_embeddings_batch(texts)

    cur = conn.cursor()
    for item, emb in zip(batch, embeddings):
        try:
            cur.execute("""
                        INSERT INTO judgments
                        (title, citation, web_url, full_text, summary, embedding, court, judge, decision_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            item['title'], item['citation'], item['web_url'], item['full_text'],
                            item['summary'], emb, item.get('court'), item.get('judge'), item.get('date')
                        ))
        except Exception as e:
            logger.debug(f"Skip: {e}")

    conn.commit()


# --- MAIN ---
def main():
    print("\n" + "=" * 70)
    print("🏛️  PakLII SCRAPER - Pakistan Legal Information Institute")
    print("=" * 70 + "\n")

    conn = init_database()

    # Strategy 1: Recent cases
    logger.info("📋 Strategy 1: Recent cases")
    cases = scrape_paklii_recent()

    # Strategy 2: If not enough, scrape by year
    if len(cases) < 10:
        logger.info("\n📋 Strategy 2: Scraping by year")
        for year in [2025, 2024, 2023]:
            year_cases = scrape_paklii_by_year(year)
            cases.extend(year_cases)
            if len(cases) >= 50:  # Stop at 50
                break

    # Remove duplicates
    seen = set()
    unique = []
    for case in cases:
        if case['url'] not in seen:
            seen.add(case['url'])
            unique.append(case)

    logger.info(f"\n📊 Total unique cases: {len(unique)}")

    if unique:
        process_cases(conn, unique[:30])  # Process first 30
    else:
        logger.warning("No cases found")

    conn.close()


if __name__ == "__main__":
    main()