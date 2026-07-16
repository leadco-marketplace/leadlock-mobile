// ── Customer phone validation (NANP / US numbers) ───────────────────────────
// Every lead MUST carry a callable customer phone number — buyers pay for the
// ability to reach the customer, so an empty or fake number is a refund
// waiting to happen. Used by /api/leads/submit (authoritative) and mirrored
// client-side on web + mobile for instant feedback.
// MIRROR: leadlock-mobile/src/lib/validate-phone.ts — keep content-identical.
//
// Rules:
//  • exactly 10 digits after stripping formatting (optional leading "1" ok)
//  • area code must be a REAL, in-service US area code (allowlist below)
//  • exchange (digits 4-6) must start with 2-9 (NANP structural rule)
//  • obviously fake patterns rejected: all-same-digit, 1234567890, 0123456789
// NOTE: the 555 exchange is deliberately ALLOWED — load-test tooling depends
// on it and it's format-valid; AI lead review + dup-check catch abuse.

// ── US area codes in service as of July 2026 ─────────────────────────────────
// Source: NANPA 2024/2025 Annual Reports + 2026 activations (471, 483, 465).
// Includes DC + US territories (PR 787/939, USVI 340, Guam 671, Am. Samoa 684,
// CNMI 670). Excludes Canada, non-US Caribbean, toll-free (8xx), premium 900.
// MAINTENANCE: NANPA activates a few new overlay codes each year — add them
// here (both copies!). Next known candidates: 565 (GA), 761 (KY) — assigned
// but NOT yet in service as of 2026-07.
const US_AREA_CODES = new Set([
  "201","202","203","205","206","207","208","209","210","212","213","214","215","216","217","218","219","220","223","224",
  "225","227","228","229","231","234","235","239","240","248","251","252","253","254","256","260","262","267","269","270",
  "272","274","276","279","281","283","301","302","303","304","305","307","308","309","310","312","313","314","315","316",
  "317","318","319","320","321","323","324","325","326","327","329","330","331","332","334","336","337","339","340","341",
  "346","347","350","351","352","353","357","360","361","363","364","369","380","385","386","401","402","404","405","406",
  "407","408","409","410","412","413","414","415","417","419","423","424","425","430","432","434","435","436","440","442",
  "443","445","447","448","457","458","463","464","465","469","470","471","472","475","478","479","480","483","484","501",
  "502","503","504","505","507","508","509","510","512","513","515","516","517","518","520","530","531","534","539","540",
  "541","551","557","559","561","562","563","564","567","570","571","572","573","574","575","580","582","585","586","601",
  "602","603","605","606","607","608","609","610","612","614","615","616","617","618","619","620","621","623","624","626",
  "628","629","630","631","636","640","641","645","646","650","651","656","657","659","660","661","662","667","669","670",
  "671","678","679","680","681","682","684","686","689","701","702","703","704","706","707","708","712","713","714","715",
  "716","717","718","719","720","724","725","726","727","728","729","730","731","732","734","737","738","740","743","747",
  "748","754","757","760","762","763","765","769","770","771","772","773","774","775","779","781","785","786","787","801",
  "802","803","804","805","806","808","810","812","813","814","815","816","817","818","820","821","826","828","830","831",
  "832","835","837","838","839","840","843","845","847","848","850","854","856","857","858","859","860","861","862","863",
  "864","865","870","872","878","901","903","904","906","907","908","909","910","912","913","914","915","916","917","918",
  "919","920","924","925","928","929","930","931","934","936","937","938","939","940","941","943","945","947","948","949",
  "951","952","954","956","959","970","971","972","973","975","978","979","980","983","984","985","986","989",
]);

export function normalizeUSPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : null;
}

export type PhoneCheck =
  | { ok: true; digits: string }
  | { ok: false; reason: string };

export function validateUSPhone(raw: string | null | undefined): PhoneCheck {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { ok: false, reason: "Customer phone number is required." };
  }
  const d = normalizeUSPhone(trimmed);
  if (!d) {
    return { ok: false, reason: "Enter a valid 10-digit US phone number (e.g. 305-555-0123)." };
  }
  if (/^(\d)\1{9}$/.test(d) || d === "1234567890" || d === "0123456789") {
    return { ok: false, reason: "That phone number doesn't look real — please enter the customer's actual phone number." };
  }
  const areaCode = d.slice(0, 3);
  if (!US_AREA_CODES.has(areaCode)) {
    return { ok: false, reason: `(${areaCode}) isn't a valid US area code — please double-check the phone number.` };
  }
  if (d[3] === "0" || d[3] === "1") {
    return { ok: false, reason: "That phone number isn't valid — please double-check it." };
  }
  return { ok: true, digits: d };
}
