/**
 * The application currently uses a shared in-memory demo store, not a database.
 * Production demo access must be explicitly enabled; anyone can then enter the
 * demo administrator account. Never enable it with real users or real data.
 */
export function isDemoMode(): boolean {
  return process.env.DS_DEMO_MODE === "true" || (process.env.NODE_ENV !== "production" && process.env.DS_DEMO_MODE !== "false");
}
