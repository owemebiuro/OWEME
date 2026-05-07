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
}

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

export function AirportInput({
  label,
  placeholder,
  value,
  onChange,
}: AirportInputProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedLabel = value ? `${value.name} (${value.iata})` : "";
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
          setResults(response.data.airports);
          setActiveIndex(response.data.airports.length ? 0 : -1);
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
    <div className={styles.searchField} ref={wrapperRef}>
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
              <span className={styles.dropdownFlag}>{airport.flag}</span>
              <span>
                <span className={styles.dropdownName}>{airport.name}</span>
                <span className={styles.dropdownMeta}>
                  {airport.city}, {airport.country} · {airport.iata}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
