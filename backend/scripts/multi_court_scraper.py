"""
Pakistan Multi-Court Judgment Scraper (Fixed for PTL Database)
===============================================================
Scrapes judgments from multiple Pakistani courts.
Matches your existing database schema:
- id, title, citation, judgment_date, pdf_url, pdf_hash,
- full_text, summary, embedding, created_at, updated_at

Features:
- Selenium browser automation (bypasses bot protection)
- Works with your existing SQLite database
- OpenAI embeddings for semantic search
- Incremental updates (skips existing)
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
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
import pdfplumber
import PyPDF2
from tenacity import retry, stop_after_attempt, wait_exponential

# Selenium imports
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Suppress SSL warnings
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# OpenAI setup (optional)
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
LOG_PATH = os.path.join(DATA_DIR, 'multi_court_scraper.log')

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Court configurations
COURTS = {
    "supreme_court": {
        "name": "Supreme Court of Pakistan",
        "short_name": "SCP",
        "urls": [
            "https://www.supremecourt.gov.pk/latest-judgements/",
            "https://www.supremecourt.gov.pk/judgments/",
        ],
    },
    "lahore_hc": {
        "name": "Lahore High Court",
        "short_name": "LHC",
        "urls": [
            "https://sys.lhc.gov.pk/appjudgments/",
            "https://data.lhc.gov.pk/judges_profile/judgments/",
        ],
    },
    "sindh_hc": {
        "name": "Sindh High Court",
        "short_name": "SHC",
        "urls": [
            "https://sindhhighcourt.gov.pk/judgments/",
            "https://shc.gov.pk/judgments/",
        ],
    },
    "islamabad_hc": {
        "name": "Islamabad High Court",
        "short_name": "IHC",
        "urls": [
            "https://ihc.gov.pk/judgments",
            "https://islamabadhighcourt.gov.pk/judgments/",
        ],
    },
    "peshawar_hc": {
        "name": "Peshawar High Court",
        "short_name": "PHC",
        "urls": [
            "https://peshawarhighcourt.gov.pk/judgments/",
            "https://phc.gov.pk/judgments/",
        ],
    },
}

# =============================================================================
# LOGGING SETUP
# =============================================================================

# Fix Windows emoji encoding issue
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
# DATABASE SETUP (Matches YOUR existing schema)
# =============================================================================

def init_database() -> sqlite3.Connection:
    """Initialize SQLite database - uses YOUR existing schema."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Check if table exists
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='judgments'")
    table_exists = cur.fetchone() is not None

    if not table_exists:
        # Create table with YOUR schema
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
        logger.info("Created judgments table")

    # Check if FTS5 table exists
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='judgments_fts'")
    fts_exists = cur.fetchone() is not None

    if not fts_exists:
        try:
            # Create FTS5 virtual table
            cur.execute('''
                CREATE VIRTUAL TABLE IF NOT EXISTS judgments_fts USING fts5(
                    title, citation, full_text, summary,
                    content='judgments',
                    content_rowid='id'
                )
            ''')

            # Triggers to keep FTS in sync
            cur.execute('''
                        CREATE TRIGGER IF NOT EXISTS judgments_ai AFTER INSERT ON judgments
                        BEGIN
                    INSERT INTO judgments_fts(rowid, title, citation, full_text, summary)
                    VALUES (new.id, new.title, new.citation, new.full_text, new.summary);
                        END
                        ''')

            cur.execute('''
                        CREATE TRIGGER IF NOT EXISTS judgments_ad AFTER
                        DELETE
                        ON judgments BEGIN
                    INSERT INTO judgments_fts(judgments_fts, rowid, title, citation, full_text, summary)
                    VALUES ('delete', old.id, old.title, old.citation, old.full_text, old.summary);
                        END
                        ''')

            logger.info("FTS5 Search Activated")
        except Exception as e:
            logger.warning(f"FTS5 setup skipped: {e}")

    conn.commit()
    logger.info(f"Database ready: {DB_PATH}")
    return conn


# =============================================================================
# SELENIUM BROWSER SETUP
# =============================================================================

def create_browser() -> webdriver.Chrome:
    """Create headless Chrome browser with bot-evasion settings."""
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--ignore-ssl-errors')

    # Evasion techniques
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument(
        'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    # Additional evasion
    browser.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        '''
    })

    return browser


# =============================================================================
# PDF EXTRACTION
# =============================================================================

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF using multiple methods."""
    import io

    # Method 1: pdfplumber (best for text-based PDFs)
    try:
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
            if len(text.strip()) > 200:
                return text.strip()
    except Exception as e:
        logger.debug(f"pdfplumber failed: {e}")

    # Method 2: PyPDF2 (fallback)
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        text = '\n'.join(page.extract_text() or '' for page in reader.pages)
        if len(text.strip()) > 200:
            return text.strip()
    except Exception as e:
        logger.debug(f"PyPDF2 failed: {e}")

    return ""


def extract_citation(text: str) -> str:
    """Extract legal citation from text."""
    patterns = [
        r'(PLD\s*\d{4}\s*(?:SC|[A-Z]+)\s*\d+)',
        r'(\d{4}\s*SCMR\s*\d+)',
        r'(\d{4}\s*CLC\s*\d+)',
        r'(\d{4}\s*YLR\s*\d+)',
        r'(\d{4}\s*PCrLJ\s*\d+)',
        r'(\d{4}\s*MLD\s*\d+)',
        r'(\d{4}\s*PLC\s*\d+)',
        r'(Civil\s*(?:Appeal|Petition|Review)\s*No\.?\s*\d+[/-]?\d*)',
        r'(Criminal\s*(?:Appeal|Petition)\s*No\.?\s*\d+[/-]?\d*)',
        r'(Const(?:itutional)?\.?\s*Petition\s*No\.?\s*\d+[/-]?\d*)',
        r'(W\.?P\.?\s*No\.?\s*\d+[/-]?\d*)',
        r'(Crl\.?\s*Appeal\s*No\.?\s*\d+[/-]?\d*)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return "Unreported"


def generate_summary(text: str) -> str:
    """Generate summary from judgment text."""
    if not text:
        return ""

    # Clean and get first meaningful paragraph
    paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 100]

    for para in paragraphs[:5]:
        # Skip header-like paragraphs
        if any(skip in para.lower() for skip in ['in the', 'before', 'present:', 'versus']):
            continue
        if len(para) > 150:
            return para[:500] + "..." if len(para) > 500 else para

    return text[:500] + "..." if len(text) > 500 else text


# =============================================================================
# EMBEDDINGS (Optional - requires OpenAI API key)
# =============================================================================

def generate_embedding(text: str) -> Optional[bytes]:
    """Generate OpenAI embedding for text."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        return None

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        # Truncate to ~8000 tokens (~32000 chars)
        clean_text = ' '.join(text.split())[:32000]

        if len(clean_text) < 100:
            return None

        response = client.embeddings.create(
            input=clean_text,
            model="text-embedding-3-small"
        )

        vector = response.data[0].embedding
        return pickle.dumps(vector)

    except Exception as e:
        logger.debug(f"Embedding generation failed: {e}")
        return None


# =============================================================================
# SCRAPING FUNCTIONS
# =============================================================================

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_with_requests(url: str) -> Optional[str]:
    """Fetch page content using requests library."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }

    response = requests.get(url, headers=headers, timeout=30, verify=False)
    response.raise_for_status()
    return response.text


def fetch_with_selenium(browser: webdriver.Chrome, url: str) -> Optional[str]:
    """Fetch page content using Selenium browser."""
    try:
        browser.get(url)
        time.sleep(3)  # Wait for dynamic content

        # Scroll to load lazy content
        browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)

        return browser.page_source
    except Exception as e:
        logger.error(f"Selenium fetch failed: {e}")
        return None


def find_pdf_links(html: str, base_url: str) -> List[Dict]:
    """Extract PDF links from HTML page."""
    soup = BeautifulSoup(html, 'lxml')
    pdfs = []
    seen_urls = set()

    for link in soup.find_all('a', href=True):
        href = link['href']

        # Check if it's a PDF
        if not re.search(r'\.pdf', href, re.IGNORECASE):
            continue

        # Build full URL
        full_url = urljoin(base_url, href)

        # Skip duplicates
        if full_url in seen_urls:
            continue
        seen_urls.add(full_url)

        # Get title
        title = link.get_text(strip=True)
        if not title or len(title) < 3:
            title = os.path.basename(urlparse(full_url).path).replace('.pdf', '').replace('-', ' ').replace('_', ' ')

        # Skip non-judgment files
        skip_words = ['form', 'application', 'tender', 'circular', 'notice', 'roster', 'cause list']
        if any(word in title.lower() for word in skip_words):
            continue

        pdfs.append({
            'url': full_url,
            'title': title.strip()
        })

    return pdfs


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def download_pdf(url: str) -> Optional[bytes]:
    """Download PDF content."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }

    response = requests.get(url, headers=headers, timeout=60, verify=False)
    response.raise_for_status()

    if 'application/pdf' in response.headers.get('Content-Type', '').lower() or url.lower().endswith('.pdf'):
        return response.content

    return None


# =============================================================================
# MAIN SCRAPER
# =============================================================================

def scrape_court(conn: sqlite3.Connection, browser: webdriver.Chrome, court_id: str, court_config: Dict) -> Tuple[
    int, int, int]:
    """Scrape judgments from a single court."""
    cur = conn.cursor()
    added = 0
    skipped = 0
    errors = 0

    logger.info(f"\n{'=' * 60}")
    logger.info(f"Scraping: {court_config['name']}")
    logger.info(f"{'=' * 60}")

    all_pdfs = []

    for url in court_config['urls']:
        logger.info(f"  Trying: {url}")

        try:
            # Try Selenium first (works better for most courts)
            html = fetch_with_selenium(browser, url)

            if not html:
                # Fallback to requests
                try:
                    html = fetch_with_requests(url)
                except:
                    pass

            if not html:
                logger.warning(f"  No content from: {url}")
                continue

            pdfs = find_pdf_links(html, url)

            if pdfs:
                logger.info(f"  Found {len(pdfs)} PDFs at: {url}")
                for pdf in pdfs:
                    pdf['source_url'] = url
                    pdf['court'] = court_config['name']
                all_pdfs.extend(pdfs)
                break  # Found PDFs, don't try other URLs
            else:
                logger.info(f"  No PDFs found at: {url}")

        except Exception as e:
            logger.warning(f"  Failed: {url} - {e}")
            continue

    if not all_pdfs:
        logger.warning(f"  No PDFs found for {court_config['name']}")
        return added, skipped, errors

    # Remove duplicates
    seen = set()
    unique_pdfs = []
    for pdf in all_pdfs:
        if pdf['url'] not in seen:
            seen.add(pdf['url'])
            unique_pdfs.append(pdf)

    logger.info(f"  Processing {len(unique_pdfs)} unique PDFs...")

    for i, pdf_info in enumerate(unique_pdfs, 1):
        try:
            # Check if already in database by URL
            cur.execute("SELECT id FROM judgments WHERE pdf_url = ?", (pdf_info['url'],))
            if cur.fetchone():
                skipped += 1
                continue

            logger.info(f"  [{i}/{len(unique_pdfs)}] {pdf_info['title'][:50]}...")

            # Download PDF
            pdf_content = download_pdf(pdf_info['url'])
            if not pdf_content:
                logger.warning(f"    Failed to download PDF")
                errors += 1
                continue

            # Generate hash for deduplication
            pdf_hash = hashlib.sha256(pdf_content).hexdigest()

            # Check hash
            cur.execute("SELECT id FROM judgments WHERE pdf_hash = ?", (pdf_hash,))
            if cur.fetchone():
                skipped += 1
                continue

            # Extract text
            full_text = extract_text_from_pdf(pdf_content)

            if len(full_text) < 200:
                logger.warning(f"    Text too short (likely scanned PDF)")

            # Extract citation
            citation = extract_citation(full_text) or extract_citation(pdf_info['title'])

            # Generate summary
            summary = generate_summary(full_text)

            # Generate embedding (if available)
            embedding = generate_embedding(full_text) if full_text else None

            # Insert into database (YOUR schema)
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute('''
                        INSERT INTO judgments
                        (title, citation, judgment_date, pdf_url, pdf_hash, full_text, summary,
                         embedding, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            pdf_info['title'],
                            citation,
                            None,  # judgment_date - would need parsing
                            pdf_info['url'],
                            pdf_hash,
                            full_text,
                            summary,
                            embedding,
                            now,
                            now
                        ))

            conn.commit()
            added += 1

            if embedding:
                logger.info(f"    Added with embedding")
            else:
                logger.info(f"    Added (no embedding)")

            # Rate limiting
            time.sleep(1)

        except Exception as e:
            logger.error(f"    Error: {e}")
            errors += 1
            continue

    return added, skipped, errors


def print_stats(conn: sqlite3.Connection):
    """Print database statistics."""
    cur = conn.cursor()

    print("\n" + "=" * 60)
    print("DATABASE STATISTICS")
    print("=" * 60)

    # Total judgments
    cur.execute("SELECT COUNT(*) FROM judgments")
    total = cur.fetchone()[0]

    # With embeddings
    cur.execute("SELECT COUNT(*) FROM judgments WHERE embedding IS NOT NULL")
    with_embeddings = cur.fetchone()[0]

    # With full text
    cur.execute("SELECT COUNT(*) FROM judgments WHERE full_text IS NOT NULL AND full_text != ''")
    with_text = cur.fetchone()[0]

    print(f"  Total Judgments: {total}")
    print(f"  With AI Embeddings: {with_embeddings} ({100 * with_embeddings / max(total, 1):.1f}%)")
    print(f"  With Full Text: {with_text}")
    print(f"\n  Database: {DB_PATH}")
    print("=" * 60)


def main():
    """Main scraper function."""
    print("=" * 70)
    print("  PAKISTAN MULTI-COURT JUDGMENT SCRAPER")
    print("=" * 70)

    # Initialize database
    conn = init_database()

    # Print initial stats
    print_stats(conn)

    # Create browser
    logger.info("\nStarting browser...")
    browser = create_browser()

    total_added = 0
    total_skipped = 0
    total_errors = 0

    try:
        for court_id, court_config in COURTS.items():
            added, skipped, errors = scrape_court(conn, browser, court_id, court_config)
            total_added += added
            total_skipped += skipped
            total_errors += errors

            logger.info(f"  {court_config['short_name']}: +{added} new, {skipped} skipped, {errors} errors")

    finally:
        browser.quit()
        logger.info("Browser closed")

    # Final summary
    print("\n" + "=" * 70)
    print("  SCRAPING COMPLETE")
    print("=" * 70)
    print(f"  New Judgments Added: {total_added}")
    print(f"  Skipped (Existing): {total_skipped}")
    print(f"  Errors: {total_errors}")
    print("=" * 70)

    # Print final stats
    print_stats(conn)

    conn.close()


if __name__ == "__main__":
    main()