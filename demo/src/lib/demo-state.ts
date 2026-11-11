/** Demo-only fixtures. No requests, credentials, or production sessions. */
export function readDemo<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(`sp_demo_${key}`);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeDemo(key: string, value: unknown) {
  try {
    sessionStorage.setItem(`sp_demo_${key}`, JSON.stringify(value));
  } catch {
    /* The current screen still works with storage restricted. */
  }
}
export function demoFailure(scope: string) {
  return readDemo<string>("failure", "") === scope;
}
export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
