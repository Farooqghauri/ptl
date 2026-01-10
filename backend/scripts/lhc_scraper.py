"""
Lahore High Court Targeted Scraper
==================================
Scrapes judgments from LHC's data portal using sitemap URLs.

Sources:
- Reported Judgments (Sitting Judges)
- Reported Judgments (Former Judges)
- Green Bench Orders
- ADR Judgments
"""

import os
import sys
import hashlib
import logging
import pickle
import time
import re
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
import pdfplumber
import PyPDF2
from tenacity import retry, stop_after_attempt, wait_exponential

# Selenium
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# OpenAI (optional)
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

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, 'legal_db.sqlite')
LOG_PATH = os.path.join(DATA_DIR, 'lhc_scraper.log')

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# LHC Sources from sitemap
LHC_SOURCES = [
    {
        "name": "LHC Reported Judgments (Sitting Judges)",
        "url": "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
        "court": "Lahore High Court",
    },
    {
        "name": "LHC Reported Judgments (Former Judges)",
        "url": "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting_by_former_judges",
        "court": "Lahore High Court",
    },
    {
        "name": "LHC Green Bench Orders",
        "url": "https://data.lhc.gov.pk/reported_judgments/green_bench_orders",
        "court": "Lahore High Court (Green Bench)",
    },
    {
        "name": "LHC School Security Orders",
        "url": "https://data.lhc.gov.pk/reported_judgments/school_security_orders",
        "court": "Lahore High Court",
    },
    {
        "name": "LHC ADR Judgments",
        "url": "https://lhc.gov.pk/reported-judgments-on-adr",
        "court": "Lahore High Court (ADR)",
    },
]

# Direct PDF URL patterns for LHC
LHC_DIRECT_PATTERNS = [
    # 2025 judgments
    "https://sys.lhc.gov.pk/appjudgments/2025LHC{}.pdf",
    # 2024 judgments
    "https://sys.lhc.gov.pk/appjudgments/2024LHC{}.pdf",
    # 2023 judgments
    "https://sys.lhc.gov.pk/appjudgments/2023LHC{}.pdf",
]

# =============================================================================
# LOGGING
# =============================================================================

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# DATABASE
# =============================================================================

def init_database() -> sqlite3.Connection:
    """Initialize database."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute('''
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
                    judgment_date
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
                    TEXT
                    DEFAULT
                    CURRENT_TIMESTAMP,
                    updated_at
                    TEXT
                    DEFAULT
                    CURRENT_TIMESTAMP
                )
                ''')

    conn.commit()
    logger.info(f"Database ready: {DB_PATH}")
    return conn


# =============================================================================
# BROWSER
# =============================================================================

def create_browser() -> webdriver.Chrome:
    """Create headless Chrome browser."""
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    return browser


# =============================================================================
# PDF PROCESSING
# =============================================================================

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF."""
    import io

    try:
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
            if len(text.strip()) > 200:
                return text.strip()
    except:
        pass

    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        text = '\n'.join(page.extract_text() or '' for page in reader.pages)
        if len(text.strip()) > 200:
            return text.strip()
    except:
        pass

    return ""


def extract_citation(text: str) -> str:
    """Extract legal citation."""
    patterns = [
        r'(PLD\s*\d{4}\s*(?:Lahore|LAH|LHC)\s*\d+)',
        r'(\d{4}\s*LHC\s*\d+)',
        r'(\d{4}\s*CLC\s*\d+)',
        r'(\d{4}\s*YLR\s*\d+)',
        r'(\d{4}\s*MLD\s*\d+)',
        r'(\d{4}\s*PCrLJ\s*\d+)',
        r'(\d{4}\s*PLC\s*\d+)',
        r'(W\.?P\.?\s*No\.?\s*\d+[/-]?\d*)',
        r'(Crl\.?\s*Appeal\s*No\.?\s*\d+)',
        r'(Civil\s*Revision\s*No\.?\s*\d+)',
        r'(R\.?F\.?A\.?\s*No\.?\s*\d+)',
        r'(F\.?A\.?O\.?\s*No\.?\s*\d+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return "Unreported"


def generate_summary(text: str) -> str:
    """Generate summary."""
    if not text:
        return ""

    paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 100]

    for para in paragraphs[:5]:
        if len(para) > 150:
            return para[:500] + "..." if len(para) > 500 else para

    return text[:500] + "..." if len(text) > 500 else text


def generate_embedding(text: str) -> Optional[bytes]:
    """Generate OpenAI embedding."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        return None

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        clean_text = ' '.join(text.split())[:32000]

        if len(clean_text) < 100:
            return None

        response = client.embeddings.create(
            input=clean_text,
            model="text-embedding-3-small"
        )

        return pickle.dumps(response.data[0].embedding)
    except Exception as e:
        logger.debug(f"Embedding failed: {e}")
        return None


# =============================================================================
# SCRAPING
# =============================================================================

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def download_pdf(url: str) -> Optional[bytes]:
    """Download PDF content."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*',
    }
    response = requests.get(url, headers=headers, timeout=60, verify=False)
    response.raise_for_status()

    if len(response.content) > 1000:  # Minimum size check
        return response.content
    return None


def scrape_lhc_page(browser: webdriver.Chrome, source: Dict, conn: sqlite3.Connection) -> tuple:
    """Scrape judgments from an LHC page."""
    cur = conn.cursor()
    added = 0
    skipped = 0
    errors = 0

    logger.info(f"\n  Scraping: {source['name']}")
    logger.info(f"  URL: {source['url']}")

    try:
        browser.get(source['url'])
        time.sleep(3)

        # Scroll to load all content
        browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        html = browser.page_source
        soup = BeautifulSoup(html, 'lxml')

        # Find all PDF links
        pdf_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '.pdf' in href.lower() or 'download' in href.lower() or 'judgment' in href.lower():
                full_url = urljoin(source['url'], href)
                title = link.get_text(strip=True) or os.path.basename(href)
                pdf_links.append({'url': full_url, 'title': title})

        logger.info(f"  Found {len(pdf_links)} potential judgment links")

        # Process each PDF (limit to 30 per source)
        for i, pdf_info in enumerate(pdf_links[:30], 1):
            try:
                # Skip if already exists
                cur.execute("SELECT id FROM judgments WHERE pdf_url = ?", (pdf_info['url'],))
                if cur.fetchone():
                    skipped += 1
                    continue

                logger.info(f"    [{i}] {pdf_info['title'][:50]}...")

                # Download PDF
                pdf_content = download_pdf(pdf_info['url'])
                if not pdf_content:
                    errors += 1
                    continue

                # Hash check
                pdf_hash = hashlib.sha256(pdf_content).hexdigest()
                cur.execute("SELECT id FROM judgments WHERE pdf_hash = ?", (pdf_hash,))
                if cur.fetchone():
                    skipped += 1
                    continue

                # Extract text
                full_text = extract_text_from_pdf(pdf_content)
                citation = extract_citation(full_text) or extract_citation(pdf_info['title'])
                summary = generate_summary(full_text)
                embedding = generate_embedding(full_text) if full_text else None

                # Insert
                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                cur.execute('''
                            INSERT INTO judgments
                            (title, citation, pdf_url, pdf_hash, full_text, summary, embedding, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ''', (
                                pdf_info['title'][:200],
                                citation,
                                pdf_info['url'],
                                pdf_hash,
                                full_text,
                                summary,
                                embedding,
                                now, now
                            ))

                conn.commit()
                added += 1
                logger.info(f"      Added!")

                time.sleep(1)

            except Exception as e:
                logger.error(f"      Error: {e}")
                errors += 1
                continue

    except Exception as e:
        logger.error(f"  Page error: {e}")
        errors += 1

    return added, skipped, errors


def scrape_lhc_direct(conn: sqlite3.Connection) -> tuple:
    """Scrape LHC judgments using direct URL patterns."""
    cur = conn.cursor()
    added = 0
    skipped = 0
    errors = 0

    logger.info("\n" + "=" * 60)
    logger.info("Scraping LHC Direct URLs (sys.lhc.gov.pk)")
    logger.info("=" * 60)

    # Try different case numbers for each year
    case_numbers = list(range(1, 201, 5))  # 1, 6, 11, 16... up to 200

    for pattern in LHC_DIRECT_PATTERNS:
        year = re.search(r'(\d{4})LHC', pattern).group(1)
        logger.info(f"\n  Trying year {year}...")

        found_in_year = 0
        consecutive_failures = 0

        for num in case_numbers:
            if consecutive_failures > 10:
                logger.info(f"    Too many failures, moving to next year")
                break

            url = pattern.format(num)

            try:
                # Skip if exists
                cur.execute("SELECT id FROM judgments WHERE pdf_url = ?", (url,))
                if cur.fetchone():
                    skipped += 1
                    consecutive_failures = 0
                    continue

                # Try to download
                pdf_content = download_pdf(url)
                if not pdf_content:
                    consecutive_failures += 1
                    continue

                consecutive_failures = 0

                # Hash check
                pdf_hash = hashlib.sha256(pdf_content).hexdigest()
                cur.execute("SELECT id FROM judgments WHERE pdf_hash = ?", (pdf_hash,))
                if cur.fetchone():
                    skipped += 1
                    continue

                # Extract text
                full_text = extract_text_from_pdf(pdf_content)
                citation = extract_citation(full_text) or f"{year} LHC {num}"
                summary = generate_summary(full_text)
                embedding = generate_embedding(full_text) if full_text else None

                # Insert
                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                cur.execute('''
                            INSERT INTO judgments
                            (title, citation, pdf_url, pdf_hash, full_text, summary, embedding, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ''', (
                                f"LHC Judgment {year} - {num}",
                                citation,
                                url,
                                pdf_hash,
                                full_text,
                                summary,
                                embedding,
                                now, now
                            ))

                conn.commit()
                added += 1
                found_in_year += 1
                logger.info(f"    Added: {year}LHC{num}")

                time.sleep(0.5)

            except Exception as e:
                consecutive_failures += 1
                errors += 1
                continue

        logger.info(f"  Year {year}: Found {found_in_year} judgments")

    return added, skipped, errors


def print_stats(conn: sqlite3.Connection):
    """Print database statistics."""
    cur = conn.cursor()

    print("\n" + "=" * 60)
    print("DATABASE STATISTICS")
    print("=" * 60)

    cur.execute("SELECT COUNT(*) FROM judgments")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM judgments WHERE embedding IS NOT NULL")
    with_embeddings = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM judgments WHERE full_text IS NOT NULL AND full_text != ''")
    with_text = cur.fetchone()[0]

    print(f"  Total Judgments: {total}")
    print(f"  With AI Embeddings: {with_embeddings}")
    print(f"  With Full Text: {with_text}")
    print(f"  Database: {DB_PATH}")
    print("=" * 60)


def main():
    """Main function."""
    print("=" * 70)
    print("  LAHORE HIGH COURT JUDGMENT SCRAPER")
    print("=" * 70)

    conn = init_database()
    print_stats(conn)

    logger.info("\nStarting browser...")
    browser = create_browser()

    total_added = 0
    total_skipped = 0
    total_errors = 0

    try:
        # 1. Scrape LHC data portal pages
        print("\n" + "=" * 60)
        print("PHASE 1: Scraping LHC Data Portal")
        print("=" * 60)

        for source in LHC_SOURCES:
            added, skipped, errors = scrape_lhc_page(browser, source, conn)
            total_added += added
            total_skipped += skipped
            total_errors += errors
            logger.info(f"  Result: +{added} new, {skipped} skipped, {errors} errors")

        # 2. Scrape direct URLs
        print("\n" + "=" * 60)
        print("PHASE 2: Scraping Direct LHC URLs")
        print("=" * 60)

        added, skipped, errors = scrape_lhc_direct(conn)
        total_added += added
        total_skipped += skipped
        total_errors += errors

    finally:
        browser.quit()
        logger.info("Browser closed")

    print("\n" + "=" * 70)
    print("  SCRAPING COMPLETE")
    print("=" * 70)
    print(f"  New Judgments Added: {total_added}")
    print(f"  Skipped (Existing): {total_skipped}")
    print(f"  Errors: {total_errors}")
    print("=" * 70)

    print_stats(conn)
    conn.close()


if __name__ == "__main__":
    main()