"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type { Airport } from "@/lib/flight-checker-data";

import styles from "./AmountChecker.module.css";

interface AirportsResponse {
  airports: Airport[];
}

interface AirportFieldProps {
  id: "from" | "to";
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onAirportChange?: (airport: Airport | null) => void;
}

const MAX_AIRPORT_RESULTS = 3;

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
    return <span className={styles.afDropdownFlagText}>{airport.flag}</span>;
  }

  return (
    <span
      className={styles.afCountryFlag}
      role="img"
      aria-label={`Flaga: ${airport.country}`}
      style={{
        backgroundImage: `url("https://flagcdn.com/w40/${countryCode}.png")`,
      }}
    />
  );
}

export function AirportField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onAirportChange,
}: AirportFieldProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = draft ?? value;
  const isIdle = !isFocused && query.length === 0;
  const isFilled = query.length > 0;
  const className = [
    styles.airportField,
    isIdle ? styles.idle : "",
    isFocused ? styles.focused : "",
    isFilled ? styles.filled : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: query });

      fetch(`/api/airports/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Airport search failed");
          }

          return response.json() as Promise<AirportsResponse>;
        })
        .then((data) => {
          const airports = data.airports.slice(0, MAX_AIRPORT_RESULTS);
          const normalizedCode = query.trim().toUpperCase();

          setResults(airports);
          setActiveIndex(airports.length ? 0 : -1);

          if (/^[A-Z]{3}$/.test(normalizedCode) && value === normalizedCode) {
            onAirportChange?.(
              airports.find((airport) => airport.iata === normalizedCode) ??
                null,
            );
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
            setActiveIndex(-1);

            if (/^[A-Z]{3}$/.test(query.trim().toUpperCase())) {
              onAirportChange?.(null);
            }
          }
        });
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, onAirportChange, query, value]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectAirport(airport: Airport) {
    onChange(airport.iata);
    onAirportChange?.(airport);
    setDraft(null);
    setIsOpen(false);
    setIsFocused(false);
  }

  function handleChange(nextValue: string) {
    setDraft(nextValue);
    setIsOpen(true);

    const normalizedCode = nextValue.trim().toUpperCase();
    onChange(/^[A-Z]{3}$/.test(normalizedCode) ? normalizedCode : "");
    onAirportChange?.(null);
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
    <div className={className} ref={wrapperRef}>
      <span className={styles.afFieldLabel}>{label}</span>
      <span className={styles.afIcon}>
        <PlaneIcon />
      </span>
      <input
        id={`amount-checker-${id}`}
        aria-label={label}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        value={query}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        onFocus={() => {
          setIsFocused(true);
          setIsOpen(true);
        }}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && results.length ? (
        <div id={listId} role="listbox" className={styles.afDropdown}>
          {results.map((airport, index) => (
            <button
              id={`${listId}-${index}`}
              key={airport.iata}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              className={`${styles.afDropdownItem} ${
                activeIndex === index ? styles.afDropdownItemActive : ""
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectAirport(airport)}
            >
              <span className={styles.afDropdownCode}>
                <strong>{airport.iata}</strong>
              </span>
              <span className={styles.afDropdownCopy}>
                <span className={styles.afDropdownName}>
                  <AirportFlag airport={airport} />
                  <span>{airport.name}</span>
                </span>
                <span className={styles.afDropdownMeta}>
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
