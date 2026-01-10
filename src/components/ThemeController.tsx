// src/components/ThemeController.tsx
"use client";

import { useEffect, useState } from "react";

export default function ThemeController() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="fixed top-2 right-2 z-50 px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 text-sm"
    >
      {darkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
