"""
Supreme Court Scraper - SELENIUM VERSION
✅ Uses real Chrome browser to bypass bot protection
✅ Automatically downloads ChromeDriver
✅ Works with current Supreme Court website
"""

import os
import sys
import time
import hashlib
import logging
import pickle
import re
import io
import sqlite3
import numpy as np
from typing import List, Dict, Optional
from urllib.parse import urljoin

# Windows fix
sys.stdout.reconfigure(encoding='utf-8')

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

import PyPDF2
import pdfplumber
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Paths
current_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(current_dir, "../data")
DB_PATH = os.path.join(DATA_DIR, "legal_db.sqlite")
ENV_PATH = os.path.join(current_dir, "../.env")

# Environment
load_dotenv(ENV_PATH)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Logging
os.makedirs(DATA_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(DATA_DIR, 'scraper.log'), encoding='utf-8'),
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
                    TEXT
                    UNIQUE
                    NOT
                    NULL,
                    pdf_hash
                    TEXT
                    UNIQUE,
                    full_text
                    TEXT,
                    summary
                    TEXT,
                    embedding
                    BLOB,
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
        logger.info("✅ FTS5 Search Ready")
    except:
        pass

    cur.execute("CREATE INDEX IF NOT EXISTS idx_pdf_hash ON judgments(pdf_hash);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pdf_url ON judgments(pdf_url);")

    conn.commit()
    return conn


# --- SELENIUM BROWSER SETUP ---
def setup_browser() -> webdriver.Chrome:
    """Setup Chrome with anti-detection options"""
    logger.info("🌐 Setting up Chrome browser...")

    chrome_options = Options()

    # Anti-detection settings
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    # Performance settings
    chrome_options.add_argument('--headless')  # Run without GUI (faster)
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')

    # Realistic browser fingerprint
    chrome_options.add_argument(
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

    try:
        # Auto-install ChromeDriver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)

        # Execute CDP commands to hide automation
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        })
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        logger.info("✅ Browser ready")
        return driver

    except Exception as e:
        logger.error(f"❌ Browser setup failed: {e}")
        logger.info("Try installing Chrome browser if not installed")
        return None


# --- SCRAPING WITH SELENIUM ---
def scrape_with_browser(driver, url: str) -> List[Dict]:
    """Scrape PDF links using Selenium"""
    logger.info(f"🔍 Loading: {url}")

    try:
        driver.get(url)

        # Wait for page to load
        time.sleep(3)

        # Try different strategies to find PDFs
        pdf_links = []

        # Strategy 1: Find all links
        all_links = driver.find_elements(By.TAG_NAME, 'a')
        logger.info(f"   Found {len(all_links)} total links")

        for link in all_links:
            try:
                href = link.get_attribute('href')
                text = link.text.strip()

                if href and href.lower().endswith('.pdf'):
                    # Skip non-judgment PDFs
                    if any(word in text.lower() for word in ['cause list', 'roster', 'form', 'notice']):
                        continue

                    pdf_links.append({
                        'url': href,
                        'title': text or href.split('/')[-1]
                    })

            except:
                continue

        logger.info(f"✅ Found {len(pdf_links)} judgment PDFs")
        return pdf_links

    except TimeoutException:
        logger.error("⏱️ Page load timeout")
        return []
    except Exception as e:
        logger.error(f"❌ Scraping error: {e}")
        return []


# --- PDF PROCESSING (Same as before) ---
def extract_text_smart(pdf_bytes: bytes) -> str:
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        if len(text.strip()) > 100:
            return re.sub(r'\s+', ' ', text).strip()
    except:
        pass

    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            t = page.extract_text()
            if t: text += t + "\n"
    except:
        pass

    return re.sub(r'\s+', ' ', text).strip()


def extract_citation(text: str, title: str) -> str:
    patterns = [
        r'(PLD\s+\d{4}\s+\w+\s+\d+)',
        r'(SCMR\s+\d{4}\s+\d+)',
        r'(\d{4}\s+SCMR\s+\d+)',
        r'(YLR\s+\d{4}\s+\w+\s+\d+)',
        r'(CLC\s+\d{4}\s+\w+\s+\d+)'
    ]

    for pattern in patterns:
        if match := re.search(pattern, text, re.IGNORECASE):
            return match.group(1).upper()

    if match := re.search(r'(C\.?\s*P\.?\s*No\.?\s*\d+[/\-]\d{4})', title, re.IGNORECASE):
        return match.group(1)

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


# --- MAIN PROCESSING ---
def process_pdf_links(conn, pdf_links: List[Dict]):
    """Download and process PDFs"""

    pending = []
    new_count = 0
    skip_count = 0

    for idx, item in enumerate(pdf_links, 1):
        url = item['url']
        title = item['title']

        logger.info(f"\n[{idx}/{len(pdf_links)}] {title[:50]}...")

        # Check existing
        cur = conn.cursor()
        if cur.execute("SELECT id FROM judgments WHERE pdf_url = ?", (url,)).fetchone():
            logger.info("   ⏭️  Already exists")
            skip_count += 1
            continue

        # Download
        try:
            response = requests.get(url, timeout=30, verify=False)
            response.raise_for_status()
            pdf_bytes = response.content
        except Exception as e:
            logger.error(f"   ❌ Download failed: {e}")
            continue

        # Hash check
        pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
        if cur.execute("SELECT id FROM judgments WHERE pdf_hash = ?", (pdf_hash,)).fetchone():
            logger.info("   ⏭️  Duplicate")
            skip_count += 1
            continue

        # Extract text
        full_text = extract_text_smart(pdf_bytes)

        if len(full_text) < 200:
            logger.warning("   ⚠️  Text too short")
            continue

        # Metadata
        citation = extract_citation(full_text, title)
        summary = full_text[:500] + "..."

        pending.append({
            'title': title,
            'citation': citation,
            'pdf_url': url,
            'pdf_hash': pdf_hash,
            'full_text': full_text,
            'summary': summary
        })

        logger.info(f"   ✅ {citation}")
        new_count += 1

        if len(pending) >= 10:
            save_batch(conn, pending)
            pending = []

        time.sleep(1)

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
                        INSERT INTO judgments (title, citation, pdf_url, pdf_hash, full_text, summary, embedding)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (item['title'], item['citation'], item['pdf_url'], item['pdf_hash'],
                              item['full_text'], item['summary'], emb))
        except:
            pass

    conn.commit()


# --- MAIN ---
def main():
    print("\n" + "=" * 70)
    print("🤖 SELENIUM BROWSER SCRAPER")
    print("=" * 70 + "\n")

    # Setup
    conn = init_database()
    driver = setup_browser()

    if not driver:
        print("❌ Browser setup failed. Install Chrome browser and try again.")
        return

    try:
        # Target URLs to try
        urls_to_try = [
            "https://www.supremecourt.gov.pk/latest-judgements/",
            "https://www.supremecourt.gov.pk/category/judgements/",
            "https://www.supremecourt.gov.pk/"
        ]

        all_pdfs = []

        for url in urls_to_try:
            logger.info(f"\n{'=' * 70}")
            logger.info(f"Trying: {url}")
            logger.info(f"{'=' * 70}")

            pdfs = scrape_with_browser(driver, url)

            if pdfs:
                all_pdfs.extend(pdfs)
                logger.info(f"✅ Found {len(pdfs)} PDFs at this URL")

                # If we found judgments, process them
                if len(all_pdfs) >= 5:
                    break

        # Remove duplicates
        seen = set()
        unique_pdfs = []
        for pdf in all_pdfs:
            if pdf['url'] not in seen:
                seen.add(pdf['url'])
                unique_pdfs.append(pdf)

        logger.info(f"\n📊 Total unique PDFs found: {len(unique_pdfs)}")

        if unique_pdfs:
            process_pdf_links(conn, unique_pdfs)
        else:
            logger.warning("⚠️ No judgment PDFs found")
            logger.info("\nThe website might be:")
            logger.info("1. Under maintenance")
            logger.info("2. Changed structure")
            logger.info("3. Requires login")
            logger.info("\nTry the manual URL method instead.")

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)

    finally:
        driver.quit()
        conn.close()
        logger.info("✅ Browser closed")


if __name__ == "__main__":
    main()