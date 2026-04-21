"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.getElementById("article-prose");
    if (!article) return;

    function onScroll() {
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight;
      const scrolled = -rect.top;
      const pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
      setProgress(pct);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--border)",
        zIndex: 99,
      }}
    >
      <div
        style={{
          height: "100%",
          background: "var(--orange)",
          width: `${progress}%`,
          transition: "width 0.1s",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
