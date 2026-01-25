from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv(".env")

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("FAILED: OPENAI_API_KEY not found in environment")
    exit(1)

print("KEY PREFIX:", api_key[:12])

client = OpenAI(api_key=api_key)

try:
    models = client.models.list()
    print("SUCCESS: OpenAI API key is valid")
    print("Models available:", len(models.data))
except Exception as e:
    print("FAILED: OpenAI API key is invalid or blocked")
    print("ERROR:", str(e))
