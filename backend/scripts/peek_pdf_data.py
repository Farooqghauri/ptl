import json
from pathlib import Path

p = Path("data/pdf_data.json")
data = json.loads(p.read_text(encoding="utf-8"))

print("type:", type(data))
print("len:", len(data))
first = data[0]
print("first type:", type(first))
print("first keys:", list(first.keys()) if isinstance(first, dict) else None)

def show(i):
    x = data[i]
    print("\n--- sample", i, "---")
    if isinstance(x, dict):
        print("keys:", list(x.keys()))
        print("file_name:", str(x.get("file_name", ""))[:120])
        t = x.get("text", "")
        print("text first 400 chars:\n", t[:400].replace("\n","\\n"))
    else:
        print(str(x)[:400])

show(0)
show(len(data)//2)
show(len(data)-1)
