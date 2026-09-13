/**
 * Reachability chip vocabulary — MIRROR of the web src/lib/reach/chips.ts.
 * Keep the codes + labels byte-identical to the web copy. Tap-only chips are the
 * ONLY thing either side can send in the per-lead reachability chat (no free
 * text → nothing to leak). Replaces the old no_answer/wrong_number signals.
 */

export type ChipSide = "buyer" | "provider";

export interface ReachChip {
  code: string;
  label: string;
  side: ChipSide;
  group: string;
  closeOut?: boolean;
  escalates?: "wrong_number";
}

export const BUYER_CHIPS: ReachChip[] = [
  { code: "no_answer",       label: "No answer",                               side: "buyer", group: "Can't reach them" },
  { code: "no_answer_3x",    label: "Tried 3 times — no answer",               side: "buyer", group: "Can't reach them" },
  { code: "voicemail",       label: "Straight to voicemail",                   side: "buyer", group: "Can't reach them" },
  { code: "busy",            label: "Line's busy",                             side: "buyer", group: "Can't reach them" },
  { code: "disconnected",    label: "Number's disconnected",                   side: "buyer", group: "Can't reach them" },
  { code: "wrong_number",    label: "Wrong number",                            side: "buyer", group: "Something's off", escalates: "wrong_number" },
  { code: "wrong_person",    label: "Reached someone else — not the customer", side: "buyer", group: "Something's off" },
  { code: "details_wrong",   label: "Customer details are wrong",              side: "buyer", group: "Something's off" },
  { code: "never_requested", label: "Customer says they never requested this", side: "buyer", group: "Something's off" },
  { code: "already_hired",   label: "Customer already hired someone",          side: "buyer", group: "Something's off" },
  { code: "not_interested",  label: "Customer's not interested",               side: "buyer", group: "Something's off" },
  { code: "best_time",       label: "What's the best time to call?",           side: "buyer", group: "Ask the provider" },
  { code: "other_way",       label: "Any other way to reach them?",            side: "buyer", group: "Ask the provider" },
  { code: "confirm_number",  label: "Can you confirm the number?",             side: "buyer", group: "Ask the provider" },
  { code: "reach_out",       label: "Can you reach out to them?",              side: "buyer", group: "Ask the provider" },
  { code: "reached",         label: "Reached them — all set",                  side: "buyer", group: "Wrap up", closeOut: true },
  { code: "booked",          label: "Booked the job — thanks",                 side: "buyer", group: "Wrap up", closeOut: true },
  { code: "thanks_buyer",    label: "Got it, thanks",                          side: "buyer", group: "Wrap up", closeOut: true },
];

export const PROVIDER_CHIPS: ReachChip[] = [
  { code: "number_correct",     label: "Number is correct",                          side: "provider", group: "Confirm / fix" },
  { code: "double_check",       label: "Let me double-check the number",             side: "provider", group: "Confirm / fix" },
  { code: "number_updated",     label: "Updated the number — try again",             side: "provider", group: "Confirm / fix" },
  { code: "details_updated",    label: "Updated the details — try again",            side: "provider", group: "Confirm / fix" },
  { code: "try_now",            label: "Try again now",                              side: "provider", group: "Best time to call" },
  { code: "after_6pm",          label: "Call after 6pm",                             side: "provider", group: "Best time to call" },
  { code: "mornings",           label: "Best in the mornings",                       side: "provider", group: "Best time to call" },
  { code: "afternoons",         label: "Best in the afternoons",                     side: "provider", group: "Best time to call" },
  { code: "weekends",           label: "Try on weekends",                            side: "provider", group: "Best time to call" },
  { code: "will_confirm",       label: "I'll reach out and confirm",                 side: "provider", group: "I'm on it" },
  { code: "checking",           label: "Give me a few minutes — checking",           side: "provider", group: "I'm on it" },
  { code: "got_them",           label: "Got them on the phone — try now, they're expecting you", side: "provider", group: "I'm on it" },
  { code: "reaching_out",       label: "Reaching out to them now",                   side: "provider", group: "I'm on it" },
  { code: "customer_confirmed", label: "Customer confirmed — try again",             side: "provider", group: "Wrap up" },
  { code: "cant_reach",         label: "Sorry — can't reach them either",            side: "provider", group: "Wrap up" },
  { code: "still_cant",         label: "Let me know if you still can't get them",    side: "provider", group: "Wrap up" },
  { code: "glad_connected",     label: "Glad you connected",                         side: "provider", group: "Wrap up", closeOut: true },
];

const BY_CODE: Record<string, ReachChip> = {};
for (const c of [...BUYER_CHIPS, ...PROVIDER_CHIPS]) BY_CODE[c.code] = c;

export function chipLabel(code: string): string {
  return BY_CODE[code]?.label ?? code;
}
export function isCloseOut(code: string): boolean {
  return !!BY_CODE[code]?.closeOut;
}

export interface ChipGroup {
  group: string;
  chips: ReachChip[];
}

function groupChips(chips: ReachChip[]): ChipGroup[] {
  const order: string[] = [];
  const map: Record<string, ReachChip[]> = {};
  for (const c of chips) {
    if (!map[c.group]) {
      map[c.group] = [];
      order.push(c.group);
    }
    map[c.group].push(c);
  }
  return order.map((g) => ({ group: g, chips: map[g] }));
}

export function chipTray(side: ChipSide, lastChip?: string | null): ChipGroup[] {
  if (side === "buyer") return groupChips(BUYER_CHIPS);
  const groups = groupChips(PROVIDER_CHIPS);
  const last = lastChip ? BY_CODE[lastChip] : undefined;
  let first: string | null = null;
  if (last && last.side === "buyer") {
    if (last.group === "Something's off") first = "Confirm / fix";
    else if (last.group === "Can't reach them") first = "Best time to call";
    else if (last.group === "Ask the provider") first = "I'm on it";
  }
  if (!first) return groups;
  return [...groups.filter((g) => g.group === first), ...groups.filter((g) => g.group !== first)];
}
