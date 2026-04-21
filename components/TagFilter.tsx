"use client";

import { useState } from "react";
import styles from "@/app/wiedza/wiedza.module.css";

const TAGS = [
  "Wszystkie",
  "Prawa pasażera",
  "Opóźnienia",
  "Bagaż",
  "Overbooking",
  "Prawo UE",
  "Porady",
  "Case studies",
];

export default function TagFilter() {
  const [active, setActive] = useState("Wszystkie");

  return (
    <div className={styles.blogTags}>
      {TAGS.map((tag) => (
        <button
          key={tag}
          className={`${styles.tagBtn} ${active === tag ? styles.tagBtnActive : ""}`}
          onClick={() => setActive(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
