import asyncio
from routers.drafter import draft_legal_document, DraftRequest


async def test():
    try:
        request = DraftRequest(
            category="Legal Notice",
            facts="my client farooq wants to send notice to neighbor for noise",
            tone="Formal"
        )

        result = await draft_legal_document(request)
        print("✅ Drafter worked!")
        print(f"   Sections found: {result.get('sections_found')}")
        print(f"   Government: {result.get('is_government_involved')}")

    except Exception as e:
        print(f"❌ Drafter failed: {e}")
        import traceback
        traceback.print_exc()


asyncio.run(test())
