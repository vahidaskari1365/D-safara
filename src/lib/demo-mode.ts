/**
 * The application uses a shared in-memory demo store, not a database.
 * Demo access is enabled by default so the platform boots on Vercel with
 * zero configuration (no env vars needed). Set DS_DEMO_MODE=false to
 * disable the demo login endpoints (e.g. when a real auth backend with
 * real user data is connected later).
 */
export function isDemoMode(): boolean {
  return process.env.DS_DEMO_MODE !== "false";
}
