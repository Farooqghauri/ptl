// --- API Configuration ---
// This file defines the base URL for the Python backend API.

/**
 * Declaring the global variable __api_url which is injected by the Canvas environment.
 * This is necessary for TypeScript to recognize the variable without complaints.
 */
declare const __api_url: string | undefined;

/**
 * Determines the base URL for the Python API.
 * It follows a three-step priority chain:
 * 1. Checks for the global __api_url provided by the Canvas environment (highest priority for deployment).
 * 2. Fallback to the Next.js environment variable NEXT_PUBLIC_PYTHON_API_URL.
 * 3. Fallback to the local development server URL ("http://127.0.0.1:8000").
 */
const PYTHON_API_URL: string = typeof __api_url !== 'undefined' 
    ? __api_url 
    : process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://127.0.0.1:8000";

export { PYTHON_API_URL };