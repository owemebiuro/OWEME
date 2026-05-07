"use client";

import axios from "axios";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { WizardCard } from "../ui/WizardCard";
import type { Airline } from "../wizardStore";
import { useWizardStore } from "../wizardStore";
import styles from "../Wizard.module.css";

interface AirlinesResponse {
  airlines: Airline[];
}

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function relativeDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateValue(date);
}

function AirlineField() {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const airline = useWizardStore((state) => state.data.airline);
  const setData = useWizardStore((state) => state.setData);
  const selectedLabel = airline ? `${airline.name} (${airline.iata})` : "";
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? selectedLabel;
  const [results, setResults] = useState<Airline[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      axios
        .get<AirlinesResponse>("/api/airlines/search", {
          params: { q: query },
          signal: controller.signal,
        })
        .then((response) => {
          setResults(response.data.airlines);
          setActiveIndex(response.data.airlines.length ? 0 : -1);
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

  function selectAirline(nextAirline: Airline) {
    setData({ airline: nextAirline });
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
      selectAirline(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className={styles.fieldGroup} ref={wrapperRef}>
      <input
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        className={styles.textInput}
        value={query}
        placeholder="LOT Polish Airlines (LO)"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setDraft(event.target.value);
          setData({ airline: null });
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {isOpen && results.length ? (
        <div id={listId} role="listbox" className={styles.dropdown}>
          {results.map((result, index) => (
            <button
              id={`${listId}-${index}`}
              key={result.iata}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              className={`${styles.dropdownItem} ${
                activeIndex === index ? styles.dropdownItemActive : ""
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectAirline(result)}
            >
              <span>
                <span className={styles.dropdownName}>
                  {result.name} ({result.iata})
                </span>
                <span className={styles.dropdownMeta}>Kod IATA {result.iata}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Step2Details() {
  const data = useWizardStore((state) => state.data);
  const setData = useWizardStore((state) => state.setData);

  return (
    <>
      <WizardCard title="Kiedy planowo miałeś wylecieć?">
        <input
          type="date"
          className={styles.textInput}
          value={data.flightDate ?? ""}
          onChange={(event) => setData({ flightDate: event.target.value })}
        />
        <p className={styles.hint}>Kliknij aby wybrać inną datę</p>
        <div className={styles.quickDate}>
          <button
            type="button"
            className={styles.quickDateButton}
            onClick={() => setData({ flightDate: relativeDate(-1) })}
          >
            Wczoraj
          </button>
          <button
            type="button"
            className={styles.quickDateButton}
            onClick={() => setData({ flightDate: relativeDate(0) })}
          >
            Dziś
          </button>
        </div>
      </WizardCard>

      <WizardCard title="Jaką linią leciałeś?">
        <AirlineField />
      </WizardCard>

      <WizardCard title="Numer lotu">
        <div className={styles.flightNumberGrid}>
          <input
            className={styles.textInput}
            value={data.airline?.iata ?? ""}
            placeholder="LO"
            readOnly
            aria-label="Kod linii"
          />
          <input
            className={styles.textInput}
            value={data.flightNumber ?? ""}
            placeholder="231"
            inputMode="numeric"
            maxLength={4}
            aria-label="Numer lotu"
            onChange={(event) =>
              setData({ flightNumber: event.target.value.replace(/\D+/g, "") })
            }
          />
        </div>
      </WizardCard>
    </>
  );
}
