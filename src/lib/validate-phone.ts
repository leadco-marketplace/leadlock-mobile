// ── Customer phone validation (NANP / US numbers) ───────────────────────────
// MIRROR of web src/lib/validate-phone.ts — keep the two content-identical.
// Every lead MUST carry a callable customer phone number; the server enforces
// this too (/api/leads/submit), this copy gives instant on-device feedback.

export function normalizeUSPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d.length === 10 ? d : null;
}

export type PhoneCheck =
  | { ok: true; digits: string }
  | { ok: false; reason: string };

export function validateUSPhone(raw: string | null | undefined): PhoneCheck {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return { ok: false, reason: 'Customer phone number is required.' };
  }
  const d = normalizeUSPhone(trimmed);
  if (!d) {
    return { ok: false, reason: 'Enter a valid 10-digit US phone number (e.g. 305-555-0123).' };
  }
  if (/^(\d)\1{9}$/.test(d) || d === '1234567890' || d === '0123456789') {
    return { ok: false, reason: "That phone number doesn't look real — please enter the customer's actual phone number." };
  }
  if (d[0] === '0' || d[0] === '1' || (d[1] === '1' && d[2] === '1')) {
    return { ok: false, reason: "That area code isn't valid — please double-check the phone number." };
  }
  if (d[3] === '0' || d[3] === '1') {
    return { ok: false, reason: "That phone number isn't valid — please double-check it." };
  }
  return { ok: true, digits: d };
}
