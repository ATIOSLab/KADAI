export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6" role="status" aria-live="polite">
      <div className="w-full max-w-md space-y-3">
        <div className="h-6 w-1/3 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        <span className="sr-only">Memuat halaman…</span>
      </div>
    </div>
  );
}
