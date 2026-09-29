import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by order ID, customer, or product..."
        className="w-full rounded-xl border border-border-strong bg-white py-2.5 pl-10 pr-3.5 text-base text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand-dark"
      />
    </div>
  );
}
