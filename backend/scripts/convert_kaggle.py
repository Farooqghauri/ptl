import json
import pandas as pd
import os

# 1. Setup Paths
INPUT_FILE = "../data/pdf_data.json"
OUTPUT_FILE = "../data/judgments.csv"


def convert_kaggle_data():
    print(f"📂 Loading {INPUT_FILE}...")

    if not os.path.exists(INPUT_FILE):
        print("❌ Error: pdf_data.json not found in /data folder.")
        return

    # Load the JSON data
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return

    print(f"🔍 Found {len(data)} records. converting...")

    # 2. Map Kaggle Fields to PTL Format
    cleaned_rows = []

    for idx, item in enumerate(data):
        # We try to grab the best available fields from the JSON
        row = {
            "id": idx + 1,
            # If 'case_id' is missing, make one up like "SC-123"
            "citation": item.get("case_id", f"SC-{idx}"),
            # If 'title' is missing, use "Supreme Court Judgment"
            "title": item.get("title", item.get("case_title", "Supreme Court Judgment")),
            # Take the first 500 characters of the text as a summary
            "summary": item.get("content", item.get("text", ""))[:500].replace("\n", " "),
            "court": "Supreme Court of Pakistan",
            "date": item.get("date", "Unknown")
        }
        cleaned_rows.append(row)

    # 3. Save as CSV
    df = pd.DataFrame(cleaned_rows)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"✅ Success! Converted {len(df)} judgments.")
    print(f"💾 Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    convert_kaggle_data()