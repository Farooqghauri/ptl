import sqlite3
import os

# Path to your database
db_path = os.path.join(os.path.dirname(__file__), "../data/legal_db.sqlite")


def inspect():
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Count rows
    count = cur.execute("SELECT COUNT(*) FROM judgments").fetchone()[0]
    print(f"\n📊 TOTAL JUDGMENTS: {count}")

    # 2. Check Embeddings
    emb_count = cur.execute("SELECT COUNT(*) FROM judgments WHERE embedding IS NOT NULL").fetchone()[0]
    print(f"🧠 WITH AI BRAINS: {emb_count}")

    print("-" * 50)
    print(f"{'ID':<5} | {'CITATION':<20} | {'TITLE'}")
    print("-" * 50)

    # 3. List the first 10 citations
    rows = cur.execute("SELECT id, citation, title FROM judgments LIMIT 10").fetchall()
    for row in rows:
        # Handle None values safely
        cid = row[0]
        cite = row[1] if row[1] else "No Citation"
        title = row[2] if row[2] else "No Title"
        print(f"{cid:<5} | {cite:<20} | {title[:40]}...")

    conn.close()


if __name__ == "__main__":
    inspect()