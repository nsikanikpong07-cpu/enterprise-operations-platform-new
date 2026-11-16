"use client";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    let initial: "light" | "dark" = "light";
    try { if (localStorage.getItem("impressor-theme") === "dark") initial = "dark"; } catch {}
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
  }, []);
  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("impressor-theme", next); } catch {}
    setTheme(next);
  }
  return <button type="button" className="im-theme-button" onClick={toggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? "☾ Dark mode" : "☀ Light mode"}</button>;
}
