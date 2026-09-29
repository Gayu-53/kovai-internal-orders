export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong py-16 text-center">
      <p className="text-base font-medium text-ink-muted">{message}</p>
    </div>
  );
}
