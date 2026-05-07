"use client";

import { RadioOption } from "./RadioOption";
import styles from "../Wizard.module.css";

interface Option<TValue extends string | boolean> {
  label: string;
  value: TValue;
}

interface RadioListProps<TValue extends string | boolean> {
  options: readonly Option<TValue>[];
  value: TValue | null;
  onChange: (value: TValue) => void;
  columns?: boolean;
}

export function RadioList<TValue extends string | boolean>({
  options,
  value,
  onChange,
  columns = false,
}: RadioListProps<TValue>) {
  return (
    <div
      role="radiogroup"
      className={columns ? styles.radioGrid : styles.radioList}
    >
      {options.map((option) => (
        <RadioOption
          key={String(option.value)}
          selected={option.value === value}
          onSelect={() => onChange(option.value)}
        >
          {option.label}
        </RadioOption>
      ))}
    </div>
  );
}
