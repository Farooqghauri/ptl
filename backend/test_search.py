import asyncio
from routers.drafter import draft_legal_document, DraftRequest


async def test():
    request = DraftRequest(
        category="Bail Petition (Post-Arrest)",
        facts="Client arrested under section 302 PPC in FIR No. 123/2024",
        tone="Formal"
    )

    result = await draft_legal_document(request)

    print("=== SECTIONS FOUND ===")
    print("Count:", result.get("sections_found", 0))
    print("Used:", result.get("sections_used", []))
    print()
    print("=== ENGLISH DRAFT (first 800 chars) ===")
    print(result.get("draft_en", "EMPTY!")[:800])


asyncio.run(test())
