"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/app/landing.module.css";

type Result = {
  eligible: boolean;
  title: string;
  explanation: string;
  compensation_eur: number | null;
};

const FALLBACK: Record<string, Result> = {
  baggage: {
    eligible: true,
    title: "Kwalifikujesz się do odszkodowania",
    explanation:
      "Konwencja Montrealska daje Ci prawo do rekompensaty za uszkodzenie lub utratę bagażu.",
    compensation_eur: 1300,
  },
  default: {
    eligible: true,
    title: "Kwalifikujesz się do odszkodowania",
    explanation:
      "Rozporządzenie WE 261/2004 gwarantuje Ci prawo do odszkodowania od linii lotniczej.",
    compensation_eur: 600,
  },
};

export default function FlightChecker() {
  const searchParams = useSearchParams();
  const [flightNum, setFlightNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const pendingReason = searchParams.get("reason") ?? "delay";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("reason")) {
      inputRef.current?.focus();
    }
  }, [searchParams]);

  async function handleCheck() {
    if (!flightNum.trim()) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/check-flight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNum: flightNum.trim().toUpperCase(), reason: pendingReason }),
      });
      if (!res.ok) throw new Error();
      const data: Result = await res.json();
      setResult(data);
    } catch {
      setResult(FALLBACK[pendingReason] ?? FALLBACK.default);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.checkerWrap}>
      <div className={styles.checkerLabel}>Numer lotu</div>
      <div className={styles.checkerPill}>
        <input
          ref={inputRef}
          className={styles.checkerInput}
          type="text"
          placeholder="np. LO 231"
          maxLength={10}
          autoComplete="off"
          value={flightNum}
          onChange={(e) => setFlightNum(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        />
        <button
          className={styles.checkerBtn}
          onClick={handleCheck}
          disabled={loading}
        >
          {loading && <span className={styles.spinner} />}
          {loading ? "Analizuję..." : "Sprawdź"}
        </button>
      </div>

      <div className={styles.checkerSub}>
        <span className={styles.checkerSubItem}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#9e8e7e" strokeWidth="1" />
            <path d="M6 5v3.5M6 3.5v.5" stroke="#9e8e7e" strokeWidth="1" strokeLinecap="round" />
          </svg>
          Bezpłatna analiza
        </span>
        <span className={styles.checkerSubItem}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="4" width="8" height="6" rx="1" stroke="#9e8e7e" strokeWidth="1" />
            <path d="M4 4V3a2 2 0 014 0v1" stroke="#9e8e7e" strokeWidth="1" />
          </svg>
          Dane szyfrowane
        </span>
        <span className={styles.checkerSubItem}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#9e8e7e" strokeWidth="1" />
            <path d="M4 6l1.5 1.5L8 4" stroke="#9e8e7e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Wynik natychmiast
        </span>
      </div>

      {result && (
        <div className={`${styles.resultBubble} ${result.eligible ? styles.resultBubbleEligible : ""}`}>
          <div className={styles.resultRow}>
            <div
              className={styles.resultDot}
              style={{ background: result.eligible ? "var(--orange-mid)" : "#c8bdb5" }}
            >
              {result.eligible ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 5l6 6M11 5l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className={styles.resultContent}>
              <div className={`${styles.resultTitle} ${!result.eligible ? styles.resultTitleNone : ""}`}>
                {result.title}
              </div>
              <div className={styles.resultDesc}>{result.explanation}</div>
              {result.eligible && result.compensation_eur && (
                <div className={styles.resultAmount}>do {result.compensation_eur} €</div>
              )}
              {result.eligible && (
                <a href="#oferty" className={styles.resultCta}>
                  Przejdź do oferty →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
