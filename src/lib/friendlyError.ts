/**
 * friendlyError — turns a raw API error code (what `request()` throws as
 * e.message, e.g. "unauthorized", "insert_failed", "HTTP 500") into a short,
 * calm, human message so the UI never shows scary raw error text.
 *
 * Keeps the headline to ~2-3 words (per product direction) with an optional
 * one-line hint, so a hiccup reads like a normal app state, not a crash — the
 * point is to keep people IN the app instead of scaring them off.
 */
export type FriendlyError = { title: string; hint?: string };

export function friendlyError(code?: string | null): FriendlyError {
  const c = (code ?? "").toLowerCase();

  // Session / auth
  if (c === "unauthorized" || c.includes("401") || c.includes("token")) {
    return { title: "Session expired", hint: "Please sign in again to continue." };
  }
  // Not allowed / not theirs / not found for this account
  if (c === "forbidden" || c === "not_purchased" || c === "mismatch" || c === "purchase_not_found") {
    return { title: "Not available", hint: "This isn't available on your account." };
  }
  // Network / offline
  if (c.includes("network") || c.includes("fetch") || c.includes("timeout") || c.includes("failed to")) {
    return { title: "Connection issue", hint: "Check your signal and try again." };
  }
  // Real server-side failures (5xx / insert / create) and everything else
  return { title: "Something went wrong", hint: "Please try again in a moment." };
}
