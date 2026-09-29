import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-ink hover:bg-brand-dark hover:text-white active:bg-brand-dark disabled:bg-brand/50",
  secondary:
    "bg-white text-ink border border-border-strong hover:bg-paper active:bg-paper disabled:opacity-50",
  ghost: "bg-transparent text-ink hover:bg-black/5 active:bg-black/10 disabled:opacity-50",
  danger:
    "bg-white text-status-pending-text border border-status-pending/30 hover:bg-status-pending/10 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-5 py-3.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, className = "", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
