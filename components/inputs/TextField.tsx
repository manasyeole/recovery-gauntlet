"use client";

import { useEffect, useRef } from "react";
import type { FieldProps } from "./types";

export default function TextField({ step, value, onChange, onSubmit }: FieldProps) {
  const long = step.type === "longtext";
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Desktop gets autofocus; on touch it would yank up the keyboard and hide
    // the question, so leave it alone there.
    if (!window.matchMedia("(pointer: coarse)").matches) ref.current?.focus();
  }, [step.number]);

  const shared = {
    value,
    placeholder: step.placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className: "field",
    "aria-label": step.question,
    maxLength: long ? 600 : 140,
  };

  if (long) {
    return (
      <textarea
        {...shared}
        ref={ref as React.Ref<HTMLTextAreaElement>}
        rows={4}
        onKeyDown={(e) => {
          // Enter submits, Shift+Enter makes a new line.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
    );
  }

  return (
    <input
      {...shared}
      ref={ref as React.Ref<HTMLInputElement>}
      type="text"
      enterKeyHint="next"
      autoComplete={step.number === 1 ? "given-name" : "off"}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}
