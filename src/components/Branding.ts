// components/Branding.ts
export const PTL_BRAND = {
  name: "Pakistan Top Lawyers",
  site: "https://www.pakistantoplawyers.com",
  orange: "#E85D2A",

  // Your /public files:
  logoPrimaryPath: "/ptl-logo.png",
  logoAltPath: "/ptl-logo-icon.png",

  signatureLine: "— Pakistan Top Lawyers | www.pakistantoplawyers.com",
};

export function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function getBrandLogoUrl(useAlt = false) {
  return absoluteUrl(useAlt ? PTL_BRAND.logoAltPath : PTL_BRAND.logoPrimaryPath);
}
