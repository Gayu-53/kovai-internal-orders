import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Every label uses the exact same size/weight (text-sm font-medium) and
 * every input uses the exact same size/weight (text-base). Category,
 * Product, Size, Customization, everything — all fields look uniform, per
 * request. Do not vary font sizes between fields when adding new ones.
 */
export function FieldWrapper({ label, required, error, hint, children }: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-status-pending-text"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-status-pending-text">{error}</span>}
    </label>
  );
}

const baseFieldClass =
  "w-full rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand-dark disabled:opacity-50";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function TextField({ label, required, error, hint, className = "", ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <input
        className={`${baseFieldClass} ${error ? "border-status-pending" : ""} ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function TextAreaField({ label, required, error, hint, className = "", ...props }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <textarea
        className={`${baseFieldClass} min-h-[88px] resize-y ${error ? "border-status-pending" : ""} ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function SelectField({ label, required, error, hint, className = "", children, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <select
        className={`${baseFieldClass} ${error ? "border-status-pending" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
