export function generateId(): string {
  // Generate a random id: 16 characters, URL-safe
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map(() => Math.random().toString(36).slice(2))
    .join("")
    .slice(0, 16);
}
