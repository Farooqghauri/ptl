// src/assets/assets.ts
export const assets = {
  // Logos
  ptl_logo_text: "/ptl-logo-text.svg",
  ptl_logo_icon: "/ptl-logo-icon.svg",

  // Sidebar controls
  menu_icon: "/menu.svg",
  sidebar_icon: "/sidebar.svg",
  sidebar_close_icon: "/close.svg",
  dashboard_icon: "/dashboard.svg",

  // User / status
  user_icon: "/user.svg",
  bell_icon: "/bell.svg",
  settings_icon: "/settings.svg",
  logout_icon: "/logout.svg",
  help_icon: "/help.svg",

  // AI tools (existing)
  ai_draft_icon: "/ai-draft.svg",
  ai_contract_icon: "/ai-contract.svg",
  ai_case_icon: "/ai-case.svg",
  ai_research_icon: "/ai-research.svg",
  ai_compliance_icon: "/ai-compliance.svg",
  ai_chatbot_icon: "/ai-chatbot.svg",

  // New tool icons (summarizer, case finder)
  summarizer_icon: "/ai-draft.svg", // you can replace with a dedicated svg later
  casefinder_icon: "/ai-case.svg", // you can replace with a dedicated svg later

  // fallback
  placeholder_icon: "/placeholder.svg",
} as const;
