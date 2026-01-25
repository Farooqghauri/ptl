# backend/schemas/judgment_summary.py

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class Holding(BaseModel):
    """Final holding/order of the court judgment."""

    outcome: str = Field(
        default="Not mentioned",
        description="Case outcome: Allowed|Dismissed|Disposed|Partly allowed|Not mentioned",
    )
    short_order: str = Field(
        default="Not mentioned",
        description="One-line final order in plain English",
    )
    quoted_lines: List[str] = Field(
        default_factory=list,
        description="Exact quotes from judgment supporting the outcome",
    )


class JudgmentSummary(BaseModel):
    """Structured summary of a court judgment."""

    case_title: str = Field(
        default="Not mentioned",
        description="Full case title with parties",
    )
    court: str = Field(
        default="Not mentioned",
        description="Name of the court",
    )
    decision_date: Optional[str] = Field(
        default=None,
        description="Decision date in DD.MM.YYYY format or null",
    )
    bench: List[str] = Field(
        default_factory=list,
        description="Names of presiding judge(s)",
    )
    procedural_history: str = Field(
        default="Not mentioned",
        description="Brief procedural background of the case",
    )
    key_facts: str = Field(
        default="Not mentioned",
        description="Material facts of the case",
    )
    issues: List[str] = Field(
        default_factory=list,
        description="Legal issues framed for determination",
    )
    holding: Holding = Field(
        default_factory=Holding,
        description="Final holding and order",
    )
    citations: List[str] = Field(
        default_factory=list,
        description="Case law and statutes cited",
    )
    takeaways: List[str] = Field(
        default_factory=list,
        description="Key legal principles established",
    )