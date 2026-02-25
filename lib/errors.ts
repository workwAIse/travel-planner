export function formatFetchError(err: unknown, context: string): string {
  const msg = err instanceof Error ? err.message : "Request failed.";
  const cause =
    err instanceof Error && err.cause != null
      ? String(err.cause instanceof Error ? err.cause.message : err.cause)
      : null;
  const detail = cause ? `${msg} (${cause})` : msg;
  return `${detail}`;
}
