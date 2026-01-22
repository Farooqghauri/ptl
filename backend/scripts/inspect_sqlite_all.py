import sqlite3
from pathlib import Path

DBS = [
    Path("data/law_index.sqlite"),
    Path("data/legal_db.sqlite"),
]

def inspect(db_path: Path):
    print("\n==============================")
    print("DB:", db_path.resolve())
    print("==============================")

    if not db_path.exists():
        print("MISSING")
        return

    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    tables = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    table_names = [r["name"] for r in tables]
    print("TABLES:", table_names)

    for t in table_names:
        cols = cur.execute(f"PRAGMA table_info({t})").fetchall()
        col_names = [c["name"] for c in cols]
        count = cur.execute(f"SELECT COUNT(1) AS c FROM {t}").fetchone()["c"]
        print(f"\n--- {t} ---")
        print("columns:", col_names)
        print("rows:", count)

        sample = cur.execute(f"SELECT * FROM {t} LIMIT 2").fetchall()
        for i, row in enumerate(sample):
            d = dict(row)
            for k, v in list(d.items()):
                if isinstance(v, str) and len(v) > 140:
                    d[k] = v[:140] + "..."
            print(f"sample {i}:", d)

    con.close()

def main():
    for db in DBS:
        inspect(db)

if __name__ == "__main__":
    main()
