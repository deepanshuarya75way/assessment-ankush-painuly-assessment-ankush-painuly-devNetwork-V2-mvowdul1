import { useEffect, useState } from "react";

const THEME_KEY = "devnetwork-theme";

function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    const currentTheme = getStoredTheme();
    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, []);

  const nextTheme = theme === "light" ? "dark" : "light";

  const handleToggle = () => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className={`inline-flex items-center gap-2 rounded-full border border-dark-400 bg-dark-700/90 text-slate-700 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:border-brand-500 hover:text-slate-950 ${
        compact ? "px-3 py-2 text-xs font-medium" : "px-4 py-2.5 text-sm font-medium"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/12 text-brand-600">
        {theme === "light" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3V5.5M12 18.5V21M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M3 12H5.5M18.5 12H21M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93M16 12A4 4 0 1 1 8 12A4 4 0 0 1 16 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5A8.5 8.5 0 1 0 20.5 14.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span>{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
