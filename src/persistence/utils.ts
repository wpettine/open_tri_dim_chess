export function generateId(): string {
  const maybeCrypto = typeof crypto !== 'undefined' ? crypto : undefined;
  if (maybeCrypto && 'randomUUID' in maybeCrypto && typeof (maybeCrypto as { randomUUID: () => string }).randomUUID === 'function') {
    return (maybeCrypto as { randomUUID: () => string }).randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, wait = 400) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}
