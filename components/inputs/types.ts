import type { Step } from "@/lib/steps";

export interface FieldProps {
  step: Step;
  value: string;
  onChange: (value: string) => void;
  /** Commit the current value and move to the next step. */
  onSubmit: () => void;
}
