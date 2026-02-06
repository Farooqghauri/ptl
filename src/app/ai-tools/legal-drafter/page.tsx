/**
 * ════════════════════════════════════════════════════════════════
 * FILE LOCATION: frontend/app/tools/drafter/page.tsx
 * ════════════════════════════════════════════════════════════════
 *
 * Enhanced Legal Drafter with:
 * - Professional Word downloads with PTL header/footer + cover page
 * - ACTUAL PTL LOGO embedded (base64)
 * - Dark theme matching other AI tools
 * - Improved "How to Use" section
 * - SEO keywords and metadata
 */

"use client";

import { useState } from "react";
import Head from "next/head";
import {
  Scale,
  PenTool,
  Copy,
  CheckCircle,
  FileText,
  Sparkles,
  ChevronDown,
  BookOpen,
  Zap,
  Shield,
  Clock,
  HelpCircle,
  X,
  FileDown,
  Languages,
} from "lucide-react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  PageBreak,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  PageNumber,
  NumberFormat,
} from "docx";
import ToolHeader from "@/components/ToolHeader";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { downloadBlob } from "@/lib/download";
import { jsPDF } from "jspdf";

let urduFontLoaded = false;
const URDU_FONT_FILE = "NotoNastaliqUrdu-Regular.ttf";
const URDU_FONT_NAME = "NotoNastaliqUrdu";

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

// ═══════════════════════════════════════════════════════════════
// SEO CONSTANTS (used in Head component below)
// ═══════════════════════════════════════════════════════════════
const SEO = {
  title:
    "AI Legal Drafter Pakistan | Generate Bail Petitions, Writ, Divorce Deeds | PTL",
  description:
    "Free AI Legal Document Generator for Pakistani Lawyers. Draft Bail Petitions, Writ Petitions, Legal Notices, Divorce Deeds, Recovery Suits in seconds. Based on PPC, CrPC, CPC, Constitution of Pakistan.",
  keywords:
    "legal drafter pakistan, AI legal document generator, bail petition generator, writ petition pakistan, legal notice generator, divorce deed pakistan, khula petition, pakistani law document, CrPC 497 bail, Article 199 writ, free legal drafting tool, pakistan top lawyers, PTL legal tools, automated legal drafting, law document AI",
  ogTitle: "AI Legal Drafter | Pakistan Top Lawyers",
  ogDescription: "Generate professional legal documents instantly with AI",
};

// ═══════════════════════════════════════════════════════════════
// PTL BRANDING CONSTANTS WITH ACTUAL LOGO
// ═══════════════════════════════════════════════════════════════
const PTL_BRAND = {
  name: "Pakistan Top Lawyers",
  tagline: "AI-Powered Legal Solutions",
  website: "www.pakistantoplawyers.com",
  disclaimer: `DISCLAIMER: This document was generated using AI technology by Pakistan Top Lawyers (PTL). 
While every effort has been made to ensure accuracy based on Pakistani law (PPC, CrPC, CPC, Constitution), 
this document is for reference purposes only and should be reviewed by a qualified legal professional 
before submission to any court or authority. PTL and its AI tools do not constitute legal advice. 
The user assumes full responsibility for the use of this document.`,
  // ACTUAL PTL LOGO - Base64 encoded JPG/PNG
  // NOTE: Your pasted string starts with "/9j/" which is JPG base64.
  logoBase64:
    "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",
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Convert base64 to Uint8Array for docx ImageRun (LOGO FIX)
// Fixes logo issue: your base64 is extremely long and often gets truncated.
// This helper validates + decodes safely.
// ═══════════════════════════════════════════════════════════════
const base64ToUint8Array = (base64: string): Uint8Array => {
  if (!base64) throw new Error("Empty base64 string");

  // 1) Remove data-uri prefix if present
  let cleaned = base64.replace(/^data:.*;base64,/, "");

  // 2) Remove ALL whitespace/newlines
  cleaned = cleaned.replace(/\s+/g, "");

  // 3) Convert URL-safe base64 to standard base64 (if any)
  cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");

  // 4) Ensure ONLY valid base64 chars exist
  //    (A-Z, a-z, 0-9, +, /, =)
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
    throw new Error(
      "Invalid base64 for logo. It contains non-base64 characters (often caused by truncation or bad paste)."
    );
  }

  // 5) Fix missing padding
  const pad = cleaned.length % 4;
  if (pad) cleaned += "=".repeat(4 - pad);

  // 6) Decode
  const binaryString = atob(cleaned);

  // 7) Convert to bytes
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// ═══════════════════════════════════════════════════════════════
// DOCUMENT GENERATION WITH PTL BRANDING + ACTUAL LOGO
// ═══════════════════════════════════════════════════════════════

const createPTLDocument = async (
  draftContent: string,
  category: string,
  language: "en" | "ur" = "en"
) => {
  const currentDate = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Convert logo base64 to Uint8Array
  let logoData: Uint8Array | null = null;
  try {
    logoData = base64ToUint8Array(PTL_BRAND.logoBase64);
  } catch (error) {
    console.error("PTL logo decode failed, continuing without logo:", error);
  }

  // Cover Page Paragraphs
  const coverPage = [
    new Paragraph({ spacing: { after: 800 } }),
    new Paragraph({ spacing: { after: 800 } }),

    // PTL Logo - ACTUAL IMAGE (optional if decode fails)
    ...(logoData
      ? [
          new Paragraph({
            children: [
              new ImageRun({
                // ✅ FIX: Your base64 starts with "/9j/" which is JPEG, not PNG
                type: "jpg",
                data: logoData,
                transformation: {
                  width: 120,
                  height: 120,
                },
                altText: {
                  title: "PTL Logo",
                  description: "Pakistan Top Lawyers Logo",
                  name: "PTL Logo",
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
        ]
      : []),

    // PTL Name
    new Paragraph({
      children: [
        new TextRun({
          text: "PAKISTAN TOP LAWYERS",
          bold: true,
          size: 56,
          color: "B8860B", // Dark golden
          font: "Georgia",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),

    // Tagline
    new Paragraph({
      children: [
        new TextRun({
          text: PTL_BRAND.tagline,
          italics: true,
          size: 28,
          color: "666666",
          font: "Georgia",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),

    // Decorative line
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "B8860B",
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),

    // Document Type
    new Paragraph({
      children: [
        new TextRun({
          text: "LEGAL DOCUMENT",
          bold: true,
          size: 32,
          color: "333333",
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: category.toUpperCase(),
          bold: true,
          size: 44,
          color: "1a1a1a",
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),

    // Decorative line
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "B8860B",
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),

    // Generated info
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on: ${currentDate}`,
          size: 24,
          color: "666666",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Language: ${language === "en" ? "English" : "Urdu (اردو)"}`,
          size: 24,
          color: "666666",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Website
    new Paragraph({
      children: [
        new TextRun({
          text: PTL_BRAND.website,
          size: 22,
          color: "B8860B",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    // Page break after cover
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];

  // Main Document Content
  const bodyFont = language === "ur" ? "Jameel Noori Nastaleeq" : "Times New Roman";
  const contentParagraphs = draftContent.split("\n").map((line) => {
    const trimmedLine = line.trim();
    const isHeading =
      trimmedLine === trimmedLine.toUpperCase() &&
      trimmedLine.length > 5 &&
      trimmedLine.length < 100;
    const isCentered =
      isHeading ||
      trimmedLine.startsWith("IN THE") ||
      trimmedLine.includes("VERSUS") ||
      trimmedLine.includes("PETITIONER") ||
      trimmedLine.includes("RESPONDENT");

    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 24,
          font: bodyFont,
          bold: isHeading,
        }),
      ],
      spacing: { after: 120, line: 276 },
      alignment: isCentered ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    });
  });

  // Disclaimer Page
  const disclaimerPage = [
    new Paragraph({
      children: [new PageBreak()],
    }),

    new Paragraph({ spacing: { after: 400 } }),

    // Decorative header
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "B8860B",
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "IMPORTANT DISCLAIMER",
          bold: true,
          size: 32,
          color: "8B0000",
          font: "Georgia",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "B8860B",
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: PTL_BRAND.disclaimer,
          size: 22,
          color: "333333",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 300 },
    }),

    new Paragraph({ spacing: { after: 600 } }),

    // PTL Contact
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "B8860B",
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "PAKISTAN TOP LAWYERS",
          bold: true,
          size: 28,
          color: "B8860B",
          font: "Georgia",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "Your Trusted AI-Powered Legal Partner",
          italics: true,
          size: 24,
          color: "666666",
          font: "Georgia",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: PTL_BRAND.website,
          size: 24,
          color: "B8860B",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  // Create document with header and footer
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Pakistan Top Lawyers",
                    bold: true,
                    size: 18,
                    color: "B8860B",
                    font: "Georgia",
                  }),
                  new TextRun({
                    text: "  |  ",
                    size: 18,
                    color: "CCCCCC",
                  }),
                  new TextRun({
                    text: category,
                    size: 18,
                    color: "666666",
                    font: "Arial",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "─".repeat(80),
                    size: 16,
                    color: "DDDDDD",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "─".repeat(80),
                    size: 16,
                    color: "DDDDDD",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${PTL_BRAND.website}`,
                    size: 18,
                    color: "B8860B",
                    font: "Arial",
                  }),
                  new TextRun({
                    text: "  |  AI-Generated Legal Document  |  Page ",
                    size: 18,
                    color: "999999",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "999999",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18,
                    color: "999999",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: "999999",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [...coverPage, ...contentParagraphs, ...disclaimerPage],
      },
    ],
  });

  return doc;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LegalDrafter() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [category, setCategory] = useState("Bail Petition (Post-Arrest)");
  const [facts, setFacts] = useState("");
  const [draftEn, setDraftEn] = useState("");
  const [draftUr, setDraftUr] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"en" | "ur">("en");
  const [showHelp, setShowHelp] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [sectionsUsed, setSectionsUsed] = useState<string[]>([]);
  const [sectionsCount, setSectionsCount] = useState(0);

  const categories = [
    "Bail Petition (Post-Arrest)",
    "Bail Petition (Pre-Arrest)",
    "Legal Notice",
    "Suit for Recovery",
    "Divorce Deed (Talaq-nama)",
    "Custody Petition",
    "Cheque Dishonour",
    "Quashing FIR",
    "Stay Application",
    "Writ Petition",
  ];

  const handleDraft = async () => {
    if (!facts.trim()) return;
    setLoading(true);
    setDraftEn("");
    setDraftUr("");
    setSectionsUsed([]);
    setSectionsCount(0);

    try {
      const response = await fetch(`${API_BASE}/api/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, facts }),
      });
      const data = await response.json();

      if (data.draft_en) setDraftEn(data.draft_en);
      if (data.draft_ur) setDraftUr(data.draft_ur);
      if (data.sections_used) setSectionsUsed(data.sections_used);
      if (data.sections_found) setSectionsCount(data.sections_found);
    } catch (error) {
      console.error("Drafting failed:", error);
      setDraftEn(
        "Error: Could not connect to the drafting server. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = activeTab === "en" ? draftEn : draftUr;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadUrduFont = async (doc: jsPDF): Promise<boolean> => {
    if (urduFontLoaded) {
      doc.setFont(URDU_FONT_NAME, "normal");
      doc.setR2L(true);
      return true;
    }
    try {
      const res = await fetch(`/fonts/${URDU_FONT_FILE}`);
      if (!res.ok) throw new Error("Urdu font not found");
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      doc.addFileToVFS(URDU_FONT_FILE, base64);
      doc.addFont(URDU_FONT_FILE, URDU_FONT_NAME, "normal");
      urduFontLoaded = true;
      doc.setFont(URDU_FONT_NAME, "normal");
      doc.setR2L(true);
      return true;
    } catch (err) {
      console.error("Urdu font load failed:", err);
      return false;
    }
  };

  const handleDownloadWord = async (language: "en" | "ur") => {
    const content = language === "en" ? draftEn : draftUr;
    if (!content) return;

    setDownloadError("");
    try {
      const doc = await createPTLDocument(content, category, language);
      const blob = await Packer.toBlob(doc);
      const filename = `PTL_${category.replace(/\s+/g, "_")}_${language.toUpperCase()}.docx`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error("Download failed:", error);
      try {
        const safeContent = content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${category}</title>
</head>
<body style="font-family:${
          language === "ur"
            ? "'Jameel Noori Nastaleeq','Noto Naskh Urdu','Times New Roman',serif"
            : "'Times New Roman',serif"
        }; padding:40px; line-height:1.6; direction:${language === "ur" ? "rtl" : "ltr"};">
  <h1 style="text-align:center;">${category}</h1>
  <p><strong>Generated by:</strong> Pakistan Top Lawyers</p>
  <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-PK")}</p>
  <hr style="margin:20px 0;" />
  <pre style="white-space:pre-wrap; font-family:${
            language === "ur"
              ? "'Jameel Noori Nastaleeq','Noto Naskh Urdu','Times New Roman',serif"
              : "'Times New Roman',serif"
          };">${safeContent}</pre>
</body>
</html>
        `.trim();
        const fallbackBlob = new Blob([html], {
          type: "application/msword",
        });
        const fallbackName = `PTL_${category.replace(/\s+/g, "_")}_${language.toUpperCase()}.doc`;
        downloadBlob(fallbackBlob, fallbackName);
      } catch (fallbackError) {
        console.error("Word fallback failed:", fallbackError);
        setDownloadError(
          "Download failed. Please try again or refresh the page."
        );
      }
    }
  };

  const handleDownloadPdf = async (language: "en" | "ur") => {
    const content = language === "en" ? draftEn : draftUr;
    if (!content) return;

    setDownloadError("");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      const scale = 2;

      const isUrdu = language === "ur";
      const fontFamily = isUrdu
        ? "'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Times New Roman',serif"
        : "'Times New Roman',serif";

      if (isUrdu) {
        try {
          await document.fonts.load(`16px 'Noto Nastaliq Urdu'`);
          await document.fonts.ready;
        } catch (err) {
          console.error("Urdu font load failed:", err);
          setDownloadError(
            "Urdu PDF requires a font. Ensure NotoNastaliqUrdu-Regular.ttf is in public/fonts."
          );
        }
      }

      const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        maxWidthPx: number
      ): string[] => {
        const lines: string[] = [];
        const paragraphs = text.split("\n");
        for (const para of paragraphs) {
          if (!para.trim()) {
            lines.push("");
            continue;
          }
          const words = para.split(" ");
          let line = "";
          for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width <= maxWidthPx) {
              line = test;
            } else {
              if (line) lines.push(line);
              line = word;
            }
          }
          if (line) lines.push(line);
        }
        return lines;
      };

      const renderPage = (
        lines: string[],
        startIndex: number,
        header: string
      ): { canvas: HTMLCanvasElement; nextIndex: number } => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(pageWidth * scale);
        canvas.height = Math.floor(pageHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const px = (pt: number) => pt * scale;
        const startX = px(margin);
        let y = px(60);

        ctx.fillStyle = "#000000";
        ctx.font = `${px(18)}px ${fontFamily}`;
        ctx.direction = "ltr";
        ctx.textAlign = "left";
        ctx.fillText(header, startX, y);
        y += px(24);

        ctx.font = `${px(11)}px ${fontFamily}`;
        ctx.fillText("Generated by: Pakistan Top Lawyers", startX, y);
        y += px(16);
        ctx.fillText(
          `Date: ${new Date().toLocaleDateString("en-PK")}`,
          startX,
          y
        );
        y += px(24);

        const bodyFontSize = isUrdu ? 16 : 12;
        const bodyLineHeight = isUrdu ? 28 : 16;
        ctx.font = `${px(bodyFontSize)}px ${fontFamily}`;
        ctx.direction = isUrdu ? "rtl" : "ltr";
        ctx.textAlign = isUrdu ? "right" : "left";
        const textX = isUrdu ? px(pageWidth - margin) : startX;
        const lineHeight = px(bodyLineHeight);
        const maxTextY = px(pageHeight - margin);

        let i = startIndex;
        while (i < lines.length) {
          if (y + lineHeight > maxTextY) break;
          ctx.fillText(lines[i], textX, y);
          y += lineHeight;
          i += 1;
        }

        return { canvas, nextIndex: i };
      };

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Canvas context not available");
      tempCtx.font = `${(isUrdu ? 16 : 12) * scale}px ${fontFamily}`;
      const wrapped = wrapText(tempCtx, content, contentWidth * scale);

      let index = 0;
      let first = true;
      while (index < wrapped.length) {
        const { canvas, nextIndex } = renderPage(
          wrapped,
          index,
          category
        );
        const imgData = canvas.toDataURL("image/png");
        if (!first) doc.addPage();
        doc.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
        first = false;
        index = nextIndex;
      }

      const filename = `PTL_${category.replace(/\s+/g, "_")}_${language.toUpperCase()}.pdf`;
      const blob = doc.output("blob");
      downloadBlob(blob, filename);
    } catch (error) {
      console.error("PDF download failed:", error);
      setDownloadError(
        "PDF download failed. Please try again or refresh the page."
      );
    }
  };

  const currentDraft = activeTab === "en" ? draftEn : draftUr;

  return (
    <>
      {/* SEO Head */}
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <meta name="keywords" content={SEO.keywords} />
        <meta property="og:title" content={SEO.ogTitle} />
        <meta property="og:description" content={SEO.ogDescription} />
        <meta property="og:type" content="website" />
      </Head>

      <SignedIn>
        <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
          {/* Subtle grid background */}
          <div className="fixed inset-0 bg-[linear-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

          {/* Main Content */}
          <div className="relative z-10 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Hero Header */}
              <div className="text-center mb-12 pt-8">
                {/* Logo Badge */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl mb-6 shadow-2xl shadow-amber-500/20 border border-amber-400/30">
                  <Scale className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  AI Legal Drafter
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Generate professional Pakistani legal documents powered by AI.
                  Based on PPC, CrPC, CPC & Constitution.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  {[
                    { icon: Zap, text: "Instant Generation" },
                    { icon: Shield, text: "Real Law Sections" },
                    { icon: Languages, text: "English & Urdu" },
                    { icon: FileDown, text: "Word Download" },
                  ].map((feature, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-full text-sm text-gray-300"
                    >
                      <feature.icon className="w-4 h-4 text-amber-500" />
                      {feature.text}
                    </span>
                  ))}
                </div>

                {/* Help Button */}
                <button
                  onClick={() => setShowHelp(true)}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-white font-semibold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105"
                >
                  <HelpCircle className="w-5 h-5" />
                  How to Use This Tool
                </button>
              </div>

              {/* Main Grid */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* LEFT: Input Section */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <PenTool className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-white">
                        Document Details
                      </h2>
                      <p className="text-sm text-gray-500">
                        Enter your case information
                      </p>
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Document Type
                    </label>
                    <div className="relative">
                      <select
                        className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl appearance-none focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-white font-medium cursor-pointer transition-all hover:border-gray-600"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c} className="bg-gray-800">
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Facts Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Case Facts & Details
                    </label>
                    <textarea
                      className="w-full h-72 p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-white placeholder-gray-500 transition-all hover:border-gray-600"
                      placeholder="Example: My client Muhammad Ali S/o Ahmad Ali, CNIC 35202-1234567-8, resident of House No. 123, Gulberg III, Lahore, was arrested on 15th January 2024 in FIR No. 45/2024 registered at Police Station Gulberg under Section 302 PPC..."
                      value={facts}
                      onChange={(e) => setFacts(e.target.value)}
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Include: Names, CNIC, FIR No., Police Station, Sections,
                        Dates
                      </p>
                      <p className="text-xs text-gray-500">
                        {facts.length} characters
                      </p>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleDraft}
                    disabled={loading || !facts.trim()}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-3 shadow-lg
                      ${
                        loading || !facts.trim()
                          ? "bg-gray-700 cursor-not-allowed text-gray-400"
                          : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02]"
                      }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Drafting Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Legal Draft
                      </>
                    )}
                  </button>

                  {/* Sections Found Badge */}
                  {sectionsCount > 0 && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                      <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
                        <CheckCircle className="w-5 h-5" />
                        {sectionsCount} Law Sections Found
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sectionsUsed.slice(0, 5).map((section, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded-lg"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Output Section */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 flex flex-col h-[750px] shadow-xl">
                  {/* Output Header */}
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="font-bold text-white">Draft Preview</h2>
                        <p className="text-sm text-gray-500">
                          Review before downloading
                        </p>
                      </div>
                    </div>

                    {/* Language Tabs */}
                    <div className="flex bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setActiveTab("en")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === "en"
                            ? "bg-amber-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setActiveTab("ur")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === "ur"
                            ? "bg-amber-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        اردو
                      </button>
                    </div>
                  </div>

                  {/* Output Area */}
                  <div
                    className={`flex-1 p-6 overflow-y-auto text-gray-200 ${
                      activeTab === "ur"
                        ? "font-urdu text-right"
                        : "font-serif"
                    }`}
                    style={{ direction: activeTab === "ur" ? "rtl" : "ltr" }}
                  >
                    {currentDraft ? (
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {currentDraft}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">
                          Your legal draft will appear here
                        </p>
                        <p className="text-sm mt-2">
                          Select document type and enter facts to begin
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-gray-800 flex gap-3">
                    <button
                      onClick={handleCopy}
                      disabled={!currentDraft}
                      className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        currentDraft
                          ? "bg-gray-800 hover:bg-gray-700 text-white"
                          : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Text
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadPdf(activeTab)}
                      disabled={!currentDraft}
                      className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        currentDraft
                          ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/20"
                          : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      Download PDF
                    </button>
                  </div>
                  {downloadError && (
                    <p className="px-4 pb-4 text-xs text-red-400">
                      {downloadError}
                    </p>
                  )}
                </div>
              </div>

              {/* SEO Content Section */}
              <div className="mt-16 grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Pakistani Law Database",
                    description:
                      "Access 2,700+ sections from PPC, CrPC, CPC, Constitution, MFLO, QSO and more. Real law citations, not AI hallucinations.",
                    icon: BookOpen,
                  },
                  {
                    title: "Court-Ready Documents",
                    description:
                      "Generate Bail Petitions, Writ Petitions, Legal Notices, Divorce Deeds, Recovery Suits formatted for Pakistani courts.",
                    icon: FileText,
                  },
                  {
                    title: "Bilingual Output",
                    description:
                      "Get your legal documents in both English and Urdu with proper legal terminology and court formatting.",
                    icon: Languages,
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-gray-900/30 border border-gray-800 rounded-xl p-6"
                  >
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer SEO Text */}
              <div className="mt-12 text-center text-gray-600 text-sm max-w-3xl mx-auto">
                <p>
                  Pakistan Top Lawyers AI Legal Drafter helps Pakistani lawyers
                  and law students create professional legal documents including
                  bail petitions under Section 497 CrPC, constitutional writ
                  petitions under Article 199, legal notices under Section 80
                  CPC, divorce/khula petitions under Muslim Family Laws
                  Ordinance 1961, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Help Modal */}
          {showHelp && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        How to Use Legal Drafter
                      </h2>
                      <p className="text-sm text-gray-400">
                        Step-by-step guide
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {[
                    {
                      step: "1",
                      title: "Select Document Type",
                      description:
                        "Choose the type of legal document you need from the dropdown menu. Options include Bail Petition, Writ Petition, Legal Notice, Divorce Deed, and more.",
                      tip: "Each document type automatically searches relevant law sections (e.g., Bail uses CrPC 497, 498)",
                    },
                    {
                      step: "2",
                      title: "Enter Case Facts",
                      description:
                        "Provide detailed information about your case in the text area. The more specific you are, the better the draft.",
                      tip: "Include: Full names with parentage (S/o, D/o), CNIC numbers, complete addresses, FIR numbers, Police Station, relevant law sections, dates",
                    },
                    {
                      step: "3",
                      title: "Generate Draft",
                      description:
                        "Click 'Generate Legal Draft' and wait a few seconds. The AI will search our database of 2,700+ Pakistani law sections and create your document.",
                      tip: "The system shows how many law sections were found and used in your draft",
                    },
                    {
                      step: "4",
                      title: "Review & Download",
                      description:
                        "Review the generated draft in English or Urdu. Make any necessary edits, then download as a professional Word document with PTL branding.",
                      tip: "Downloaded documents include cover page, headers/footers, and legal disclaimer",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {item.description}
                        </p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <p className="text-amber-300 text-xs">
                            <strong>💡 Tip:</strong> {item.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Example */}
                  <div className="bg-gray-800 rounded-xl p-4 mt-6">
                    <h4 className="text-white font-semibold mb-2">
                      📝 Example Input
                    </h4>
                    <p className="text-gray-400 text-sm font-mono">
                      &quot;My client Muhammad Ali S/o Ahmad Ali, CNIC
                      35202-1234567-8, resident of House No. 123, Street 5,
                      Gulberg III, Lahore, was arrested on 15th January 2024 in
                      case FIR No. 45/2024 registered at Police Station Gulberg,
                      Lahore under Section 302/34 PPC. The complainant is Bashir
                      Ahmad. My client is innocent and has been falsely
                      implicated due to previous enmity.&quot;
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-4">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-white font-semibold transition-all"
                  >
                    Got it, Start Drafting!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
