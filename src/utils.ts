export function generateId(): string {
  // Generate a random id: 16 characters, URL-safe
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map(() => Math.random().toString(36).slice(2))
    .join("")
    .slice(0, 16);
}

export function safeParse<T>(raw: string | null): T[] {
  if (!raw) return [] as unknown as T[];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [] as unknown as T[];
  }
}

export function safeStringify<T>(data: T[]): string {
  try {
    return JSON.stringify(data);
  } catch {
    return "[]";
  }
}
