// App constants and configuration
export const APP_CONFIG = {
  name: "Pakistan's Top Lawyers (PTL)",
  description: "Connecting overseas Pakistanis with verified lawyers in Pakistan",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://pakistantoplawyers.com",
  version: "1.0.0",
} as const;

export const LEGAL_SERVICES = [
  {
    name: "Family & Divorce Law",
    slug: "family-divorce",
    description: "Divorce, custody, maintenance, inheritance cases",
    keywords: ["divorce", "khula", "custody", "maintenance", "inheritance"],
  },
  {
    name: "Criminal Defense",
    slug: "criminal-defense", 
    description: "Bail, FIR quash, trial defense, appeals",
    keywords: ["bail", "criminal", "defense", "trial", "appeal"],
  },
  {
    name: "Property & Real Estate",
    slug: "property-real-estate",
    description: "Property disputes, inheritance, land transfers",
    keywords: ["property", "real estate", "land", "inheritance", "DHA"],
  },
  {
    name: "Corporate & Business",
    slug: "corporate-business",
    description: "Company registration, contracts, compliance",
    keywords: ["corporate", "business", "SECP", "contracts", "compliance"],
  },
] as const;

export const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", 
  "Peshawar", "Faisalabad", "Multan", "Quetta"
] as const;

export const API_ENDPOINTS = {
  lawyers: "/api/lawyers",
  chat: "/api/chat", 
  summarize: "/api/summarize",
  caseSearch: "/api/casesearch",
} as const;
