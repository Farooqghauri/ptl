import requests

BASE_URL = "http://localhost:8000"

tests = [
    {"text": "Order XXI Rule 26 CPC"},
    {"text": "Section 497 CrPC"},
    {"text": "Article 199 Constitution"},
]

print("=== TESTING LAW RESOLVER ===\n")

for test in tests:
    print(f"Query: {test['text']}")
    print("-" * 40)

    try:
        response = requests.post(
            f"{BASE_URL}/api/law/resolve",
            json=test
        )

        if response.status_code == 200:
            data = response.json()
            print(f"Hits: {data.get('hits', 0)}")

            for result in data.get('results', []):
                print(f"  Key: {result.get('key')}")
                print(f"  Title: {result.get('title', 'N/A')[:60]}...")
                print(f"  Text: {result.get('text', 'N/A')[:100]}...")
                print("")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Error: {e}")

    print("\n")