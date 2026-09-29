export function CategoryFilterBar({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
          value === ""
            ? "border-brand-dark bg-brand text-ink"
            : "border-border-strong bg-white text-ink-muted hover:bg-paper"
        }`}
      >
        All Categories
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === cat
              ? "border-brand-dark bg-brand text-ink"
              : "border-border-strong bg-white text-ink-muted hover:bg-paper"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
