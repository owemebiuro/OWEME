"use client";

import type { KeyboardEvent, ReactNode } from "react";

import styles from "../Wizard.module.css";

interface RadioOptionProps {
  children: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export function RadioOption({ children, selected, onSelect }: RadioOptionProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.radioOption} ${
        selected ? styles.radioOptionSelected : ""
      }`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.radioDot} aria-hidden="true" />
      <span className={styles.radioLabel}>{children}</span>
    </button>
  );
}
