"use client";

import axios from "axios";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type { Airport } from "@/lib/flight-checker-data";

import styles from "./Landing.module.css";

interface AirportsResponse {
  airports: Airport[];
}

interface AirportInputProps {
  label: string;
  placeholder: string;
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  variant?: "default" | "prominent" | "card";
}

const MAX_AIRPORT_RESULTS = 3;

function PlaneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.2 2.8c.45.45.35 1.35-.22 1.92l-3.56 3.56 1.24 6.54-1.32 1.32-2.9-5.16-3.2 3.2.3 2.12-1.02 1.02-1.04-2.62-2.62-1.04 1.02-1.02 2.12.3 3.2-3.2-5.16-2.9 1.32-1.32 6.54 1.24 3.56-3.56c.57-.57 1.47-.67 1.92-.22Z"
        fill="currentColor"
      />
    </svg>
  );
}

function countryCodeFromFlag(flag: string) {
  const trimmed = flag.trim();

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const letters = Array.from(trimmed)
    .slice(0, 2)
    .map((char) => {
      const codePoint = char.codePointAt(0);

      if (
        typeof codePoint === "number" &&
        codePoint >= 0x1f1e6 &&
        codePoint <= 0x1f1ff
      ) {
        return String.fromCharCode(65 + codePoint - 0x1f1e6);
      }

      return "";
    })
    .join("");

  return /^[A-Z]{2}$/.test(letters) ? letters.toLowerCase() : null;
}

function AirportFlag({ airport }: { airport: Airport }) {
  const countryCode = countryCodeFromFlag(airport.flag);

  if (!countryCode) {
    return <span className={styles.dropdownFlagText}>{airport.flag}</span>;
  }

  return (
    <span
      className={styles.countryFlag}
      role="img"
      aria-label={`Flaga: ${airport.country}`}
      style={{
        backgroundImage: `url("https://flagcdn.com/w40/${countryCode}.png")`,
      }}
    />
  );
}

export function AirportInput({
  label,
  placeholder,
  value,
  onChange,
  variant = "default",
}: AirportInputProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedLabel = value ? value.iata : "";
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? selectedLabel;
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      axios
        .get<AirportsResponse>("/api/airports/search", {
          params: { q: query },
          signal: controller.signal,
        })
        .then((response) => {
          const airports = response.data.airports.slice(0, MAX_AIRPORT_RESULTS);

          setResults(airports);
          setActiveIndex(airports.length ? 0 : -1);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectAirport(airport: Airport) {
    onChange(airport);
    setDraft(null);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        results.length ? (current + 1) % results.length : -1,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current <= 0 ? results.length - 1 : current - 1) : -1,
      );
    }

    if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      selectAirport(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      className={`${styles.searchField} ${
        variant === "prominent" ? styles.searchFieldProminent : ""
      } ${
        variant === "card" ? styles.searchFieldCard : ""
      }`}
      ref={wrapperRef}
    >
      {variant === "prominent" || variant === "card" ? (
        <span className={styles.fieldLabel}>{label}</span>
      ) : null}
      <div className={styles.fieldControl}>
        <span className={styles.fieldIcon}>
          <PlaneIcon />
        </span>
        <input
          role="combobox"
          aria-label={label}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          className={styles.input}
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(null);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            className={styles.clear}
            aria-label={`Wyczyść ${label.toLowerCase()}`}
            onClick={() => {
              onChange(null);
              setDraft("");
              setIsOpen(false);
            }}
          >
            ×
          </button>
        ) : null}
      </div>
      {value ? (
        <div className={styles.selectedAirport}>
          <AirportFlag airport={value} />
          <span>
            {value.name} · {value.city}, {value.country}
          </span>
        </div>
      ) : null}
      {isOpen && results.length ? (
        <div id={listId} role="listbox" className={styles.dropdown}>
          {results.map((airport, index) => (
            <button
              id={`${listId}-${index}`}
              key={airport.iata}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              className={`${styles.dropdownItem} ${
                activeIndex === index ? styles.dropdownItemActive : ""
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectAirport(airport)}
            >
              <span className={styles.dropdownCode}>
                <strong>{airport.iata}</strong>
              </span>
              <span className={styles.dropdownCopy}>
                <span className={styles.dropdownName}>
                  <AirportFlag airport={airport} />
                  <span>{airport.name}</span>
                </span>
                <span className={styles.dropdownMeta}>
                  {airport.city}, {airport.country}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
