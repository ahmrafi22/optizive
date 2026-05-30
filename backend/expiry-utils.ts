export type ExpiryStatus = "EXPIRED" | "EXPIRING_SOON" | "EXPIRING" | "FRESH" | "NO_EXPIRY";

export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return "NO_EXPIRY";
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry <= now) return "EXPIRED";
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) return "EXPIRING_SOON";
  if (daysUntil <= 30) return "EXPIRING";
  return "FRESH";
}
