"""
Pakistan Comprehensive Legal Scraper
====================================
Scrapes judgments from ALL working Pakistani legal sources:

1. Supreme Court of Pakistan (supremecourt.gov.pk)
2. Sindh High Court Caselaw (caselaw.shc.gov.pk)
3. Federal Shariat Court (federalshariatcourt.gov.pk)
4. Attorney General Pakistan (agfp.gov.pk)
5. Lahore High Court Reported (data.lhc.gov.pk)
6. Sindh Service Tribunal (sstsindh.gov.pk)

Target: 500-1000+ judgments
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

# Suppress warnings
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
LOG_PATH = os.path.join(DATA_DIR, 'comprehensive_scraper.log')

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# All working sources
SOURCES = {
    "supreme_court": {
        "name": "Supreme Court of Pakistan",
        "short": "SCP",
        "urls": [
            "https://www.supremecourt.gov.pk/latest-judgements/",
        ],
        "method": "selenium",
    },
    "sindh_hc_caselaw": {
        "name": "Sindh High Court",
        "short": "SHC",
        "urls": [
            "https://caselaw.shc.gov.pk/caselaw/public/home",
            "https://caselaw.shc.gov.pk/caselaw/public/reported-judgements-detail-all/741/-1",
        ],
        "method": "selenium",
    },
    "federal_shariat": {
        "name": "Federal Shariat Court",
        "short": "FSC",
        "urls": [
            "https://www.federalshariatcourt.gov.pk/en/leading-judgements/",
            "https://federalshariatcourt.gov.pk/alljud.php",
        ],
        "method": "selenium",
    },
    "attorney_general": {
        "name": "Attorney General Pakistan",
        "short": "AGP",
        "urls": [
            "https://agfp.gov.pk/cases/",
            "https://www.agfp.gov.pk/cases/",
        ],
        "method": "selenium",
    },
    "lahore_hc_reported": {
        "name": "Lahore High Court",
        "short": "LHC",
        "urls": [
            "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting",
            "https://data.lhc.gov.pk/reported_judgments/judgments_approved_for_reporting_by_former_judges",
            "https://lhc.gov.pk/reported_judgments",
        ],
        "method": "selenium",
    },
    "sindh_service_tribunal": {
        "name": "Sindh Service Tribunal",
        "short": "SST",
        "urls": [
            "https://sstsindh.gov.pk/judgements.php",
        ],
        "method": "requests",
    },
    "lhc_sys_judgments": {
        "name": "Lahore High Court System",
        "short": "LHC",
        "urls": [
            "https://sys.lhc.gov.pk/appjudgments/",
        ],
        "method": "requests",
        "pattern": "https://sys.lhc.gov.pk/appjudgments/{year}LHC{num}.pdf",
    },
}

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
    """Initialize database with your existing schema."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Create table if not exists (your schema)
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

    # Ensure FTS5 exists
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='judgments_fts'")
    if not cur.fetchone():
        try:
            cur.execute('''
                CREATE VIRTUAL TABLE judgments_fts USING fts5(
                    title, citation, full_text, summary,
                    content=judgments, content_rowid=id
                )
            ''')
            logger.info("Created FTS5 table")
        except:
            pass

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
    options.add_argument('--ignore-ssl-errors')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_argument(
        'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    browser.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': 'Object.defineProperty(navigator, "webdriver", {get: () => undefined});'
    })

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
        r'(PLD\s*\d{4}\s*(?:SC|[A-Z]+)\s*\d+)',
        r'(\d{4}\s*SCMR\s*\d+)',
        r'(\d{4}\s*CLC\s*\d+)',
        r'(\d{4}\s*YLR\s*\d+)',
        r'(\d{4}\s*PCrLJ\s*\d+)',
        r'(\d{4}\s*MLD\s*\d+)',
        r'(\d{4}\s*PLC\s*\d+)',
        r'(\d{4}\s*SHC\s*(?:KHI|HYD|SUK|LRK|MIR)\s*\d+)',
        r'(Civil\s*(?:Appeal|Petition)\s*No\.?\s*\d+)',
        r'(Criminal\s*(?:Appeal|Petition)\s*No\.?\s*\d+)',
        r'(Const\.?\s*Petition\s*No\.?\s*\d+)',
        r'(W\.?P\.?\s*No\.?\s*\d+)',
        r'(Shariat\s*Petition\s*No\.?\s*\d+)',
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
# SCRAPING FUNCTIONS
# =============================================================================

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_url(url: str) -> Optional[str]:
    """Fetch URL with requests."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    response = requests.get(url, headers=headers, timeout=30, verify=False)
    response.raise_for_status()
    return response.text


def fetch_with_browser(browser: webdriver.Chrome, url: str) -> Optional[str]:
    """Fetch URL with Selenium."""
    try:
        browser.get(url)
        time.sleep(3)
        browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        return browser.page_source
    except Exception as e:
        logger.error(f"Browser fetch failed: {e}")
        return None


def find_pdf_links(html: str, base_url: str) -> List[Dict]:
    """Extract PDF links from HTML."""
    soup = BeautifulSoup(html, 'lxml')
    pdfs = []
    seen = set()

    for link in soup.find_all('a', href=True):
        href = link['href']

        # Check for PDF
        if not re.search(r'\.pdf|download|judgment|judgement', href, re.IGNORECASE):
            continue

        # Skip non-PDF links
        skip_words = ['form', 'application', 'tender', 'circular', 'notice', 'roster', 'cause.list', 'causelist']
        if any(word in href.lower() for word in skip_words):
            continue

        full_url = urljoin(base_url, href)

        if full_url in seen:
            continue
        seen.add(full_url)

        # Get title
        title = link.get_text(strip=True)
        if not title or len(title) < 3:
            title = os.path.basename(urlparse(full_url).path)
            title = title.replace('.pdf', '').replace('-', ' ').replace('_', ' ')

        # Clean title
        title = re.sub(r'\s+', ' ', title).strip()
        if len(title) < 3:
            title = f"Judgment from {urlparse(base_url).netloc}"

        pdfs.append({
            'url': full_url,
            'title': title[:200]
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

    content_type = response.headers.get('Content-Type', '').lower()
    if 'pdf' in content_type or url.lower().endswith('.pdf'):
        return response.content

    return None


# =============================================================================
# LHC DIRECT SCRAPER (Known URL Pattern)
# =============================================================================

def scrape_lhc_direct(conn: sqlite3.Connection) -> Tuple[int, int, int]:
    """Scrape LHC judgments using known URL pattern."""
    cur = conn.cursor()
    added = 0
    skipped = 0
    errors = 0

    logger.info("\n" + "=" * 60)
    logger.info("Scraping: Lahore High Court (Direct URLs)")
    logger.info("=" * 60)

    # Try recent years and case numbers
    years = [2024, 2025, 2023, 2022]

    for year in years:
        logger.info(f"  Trying year {year}...")

        # Try various case numbers
        for num in range(1, 100, 10):  # Sample every 10th
            url = f"https://sys.lhc.gov.pk/appjudgments/{year}LHC{num}.pdf"

            try:
                # Check if exists
                cur.execute("SELECT id FROM judgments WHERE pdf_url = ?", (url,))
                if cur.fetchone():
                    skipped += 1
                    continue

                pdf_content = download_pdf(url)
                if not pdf_content:
                    continue

                pdf_hash = hashlib.sha256(pdf_content).hexdigest()

                cur.execute("SELECT id FROM judgments WHERE pdf_hash = ?", (pdf_hash,))
                if cur.fetchone():
                    skipped += 1
                    continue

                full_text = extract_text_from_pdf(pdf_content)
                citation = extract_citation(full_text) or f"{year} LHC {num}"
                summary = generate_summary(full_text)
                embedding = generate_embedding(full_text) if full_text else None

                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                cur.execute('''
                            INSERT INTO judgments
                            (title, citation, judgment_date, pdf_url, pdf_hash, full_text, summary, embedding,
                             created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ''', (
                                f"LHC Judgment {year} - {num}",
                                citation,
                                None,
                                url,
                                pdf_hash,
                                full_text,
                                summary,
                                embedding,
                                now, now
                            ))

                conn.commit()
                added += 1
                logger.info(f"    Added: {year}LHC{num}")

                time.sleep(0.5)

            except Exception as e:
                errors += 1
                continue

    logger.info(f"  LHC Direct: +{added} new, {skipped} skipped, {errors} errors")
    return added, skipped, errors


# =============================================================================
# MAIN SCRAPER
# =============================================================================

def scrape_source(conn: sqlite3.Connection, browser: webdriver.Chrome,
                  source_id: str, config: Dict) -> Tuple[int, int, int]:
    """Scrape a single source."""
    cur = conn.cursor()
    added = 0
    skipped = 0
    errors = 0

    logger.info(f"\n{'=' * 60}")
    logger.info(f"Scraping: {config['name']}")
    logger.info(f"{'=' * 60}")

    all_pdfs = []

    for url in config['urls']:
        logger.info(f"  Trying: {url}")

        try:
            if config['method'] == 'selenium':
                html = fetch_with_browser(browser, url)
            else:
                html = fetch_url(url)

            if not html:
                logger.warning(f"  No content from: {url}")
                continue

            pdfs = find_pdf_links(html, url)

            if pdfs:
                logger.info(f"  Found {len(pdfs)} PDF links")
                for pdf in pdfs:
                    pdf['source'] = config['name']
                all_pdfs.extend(pdfs)
            else:
                logger.info(f"  No PDFs found")

        except Exception as e:
            logger.warning(f"  Failed: {url} - {e}")
            continue

    if not all_pdfs:
        logger.warning(f"  No PDFs found for {config['name']}")
        return added, skipped, errors

    # Remove duplicates
    seen = set()
    unique_pdfs = []
    for pdf in all_pdfs:
        if pdf['url'] not in seen:
            seen.add(pdf['url'])
            unique_pdfs.append(pdf)

    logger.info(f"  Processing {len(unique_pdfs)} unique PDFs...")

    # Limit per source to avoid too long runtime
    max_per_source = 50
    unique_pdfs = unique_pdfs[:max_per_source]

    for i, pdf_info in enumerate(unique_pdfs, 1):
        try:
            # Check existing
            cur.execute("SELECT id FROM judgments WHERE pdf_url = ?", (pdf_info['url'],))
            if cur.fetchone():
                skipped += 1
                continue

            logger.info(f"  [{i}/{len(unique_pdfs)}] {pdf_info['title'][:40]}...")

            # Download
            pdf_content = download_pdf(pdf_info['url'])
            if not pdf_content:
                logger.warning(f"    Failed to download")
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

            if len(full_text) < 200:
                logger.warning(f"    Text too short (scanned PDF)")

            # Citation & summary
            citation = extract_citation(full_text) or extract_citation(pdf_info['title'])
            summary = generate_summary(full_text)
            embedding = generate_embedding(full_text) if full_text else None

            # Insert
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute('''
                        INSERT INTO judgments
                        (title, citation, judgment_date, pdf_url, pdf_hash, full_text, summary, embedding, created_at,
                         updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            pdf_info['title'],
                            citation,
                            None,
                            pdf_info['url'],
                            pdf_hash,
                            full_text,
                            summary,
                            embedding,
                            now, now
                        ))

            conn.commit()
            added += 1

            status = "with embedding" if embedding else "no embedding"
            logger.info(f"    Added ({status})")

            time.sleep(1)

        except Exception as e:
            logger.error(f"    Error: {e}")
            errors += 1
            continue

    logger.info(f"  {config['short']}: +{added} new, {skipped} skipped, {errors} errors")
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
    print(f"  With AI Embeddings: {with_embeddings} ({100 * with_embeddings / max(total, 1):.1f}%)")
    print(f"  With Full Text: {with_text}")
    print(f"  Database: {DB_PATH}")
    print("=" * 60)


def main():
    """Main function."""
    print("=" * 70)
    print("  PAKISTAN COMPREHENSIVE LEGAL SCRAPER")
    print("  Target: 500+ Judgments from Multiple Sources")
    print("=" * 70)

    conn = init_database()
    print_stats(conn)

    logger.info("\nStarting browser...")
    browser = create_browser()

    total_added = 0
    total_skipped = 0
    total_errors = 0

    try:
        # Scrape all configured sources
        for source_id, config in SOURCES.items():
            if 'pattern' in config:
                continue  # Skip pattern-based sources

            added, skipped, errors = scrape_source(conn, browser, source_id, config)
            total_added += added
            total_skipped += skipped
            total_errors += errors

        # Special: LHC direct URL scraping
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