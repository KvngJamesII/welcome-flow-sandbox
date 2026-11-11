// Demo referral persistence, matching the original public helper signatures.
const key = "sp_referral_code";
export function storedReferralCode(): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function captureReferralCode(): string | null {
  const code = new URLSearchParams(window.location.search)
    .get("ref")
    ?.trim()
    .toUpperCase();
  if (code) {
    try {
      localStorage.setItem(key, code);
    } catch {
      /* Current referral still works. */
    }
    return code;
  }
  return storedReferralCode();
}
