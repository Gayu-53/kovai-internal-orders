export function SizeFilterBar({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (sizes.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          value === ""
            ? "border-brand-dark bg-brand text-ink"
            : "border-border-strong bg-white text-ink-muted hover:bg-paper"
        }`}
      >
        All Sizes
      </button>
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === size
              ? "border-brand-dark bg-brand text-ink"
              : "border-border-strong bg-white text-ink-muted hover:bg-paper"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
