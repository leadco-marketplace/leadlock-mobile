// ─────────────────────────────────────────────────────────────────────────────
//  LeadCo — Category-specific lead context chips
//
//  Each service category has its own tailored set of context chips that
//  help buyers quickly understand the lead's key characteristics.
//
//  Chips replace the old free-text description field on lead submission.
//  Keys are the LOWERCASE of the exact category name (see getTagsForCategory).
//  Falls back to DEFAULT_TAGS for any unrecognised category.
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadTag {
  emoji: string;
  label: string;
}

// Shown when no category-specific set is defined
export const DEFAULT_TAGS: LeadTag[] = [
  { emoji: '🚨', label: 'Emergency — needs ASAP' },
  { emoji: '🏠', label: 'Residential home' },
  { emoji: '🏢', label: 'Commercial / business' },
  { emoji: '📦', label: 'Multiple units / locations' },
  { emoji: '🔄', label: 'Replacement of existing' },
  { emoji: '✅', label: 'Ready to book' },
  { emoji: '📅', label: 'Flexible on timing' },
];

const CATEGORY_TAGS: Record<string, LeadTag[]> = {

  // ═══ LOCAL HOME SERVICES ═════════════════════════════════════════════════

  // ── GARAGE DOOR ─────────────────────────────────────────────────────────
  'garage door': [
    { emoji: '🌀', label: 'Spring broken' },
    { emoji: '🚗', label: 'Door stuck open or closed' },
    { emoji: '📡', label: 'Opener / remote not working' },
    { emoji: '🔩', label: 'Off track or cable issue' },
    { emoji: '💥', label: 'Panel dented / damaged' },
    { emoji: '✨', label: 'New door installation' },
    { emoji: '🏢', label: 'Commercial / warehouse door' },
    { emoji: '🚨', label: 'Emergency — same day needed' },
  ],

  // ── PLUMBING ────────────────────────────────────────────────────────────
  'plumbing': [
    { emoji: '💧', label: 'Active leak / water damage' },
    { emoji: '🚿', label: 'Clogged drain or toilet' },
    { emoji: '🔥', label: 'Water heater issue' },
    { emoji: '🏗️', label: 'New installation' },
    { emoji: '🐛', label: 'Sewer / septic issue' },
    { emoji: '🚨', label: 'Emergency — flooding' },
    { emoji: '🏢', label: 'Commercial property' },
    { emoji: '🔄', label: 'Replacing old pipes' },
  ],

  // ── HVAC ────────────────────────────────────────────────────────────────
  'hvac': [
    { emoji: '🥵', label: 'No AC / not cooling' },
    { emoji: '🥶', label: 'No heat / not heating' },
    { emoji: '📣', label: 'Making strange noises' },
    { emoji: '✨', label: 'New system installation' },
    { emoji: '🔧', label: 'Tune-up / maintenance' },
    { emoji: '🌡️', label: 'Thermostat issue' },
    { emoji: '💧', label: 'Water leaking from unit' },
    { emoji: '🏢', label: 'Commercial / large system' },
  ],

  // ── ELECTRICAL ──────────────────────────────────────────────────────────
  'electrical': [
    { emoji: '⚡', label: 'Breaker keeps tripping' },
    { emoji: '💡', label: 'New outlets or fixtures' },
    { emoji: '🔌', label: 'Panel upgrade needed' },
    { emoji: '🚗', label: 'EV charger installation' },
    { emoji: '🌙', label: 'Outdoor / security lighting' },
    { emoji: '🔥', label: 'Burning smell / safety issue' },
    { emoji: '🏢', label: 'Commercial / office' },
    { emoji: '🏗️', label: 'New construction wiring' },
  ],

  // ── ROOFING ─────────────────────────────────────────────────────────────
  'roofing': [
    { emoji: '🌧️', label: 'Active leak — water inside' },
    { emoji: '⛈️', label: 'Storm / hail damage' },
    { emoji: '🏚️', label: 'Missing shingles or tiles' },
    { emoji: '🔄', label: 'Full replacement needed' },
    { emoji: '🔍', label: 'Inspection only' },
    { emoji: '🏢', label: 'Commercial / flat roof' },
    { emoji: '🏗️', label: 'New construction' },
    { emoji: '☀️', label: 'Solar panels involved' },
  ],

  // ── LOCKSMITH ───────────────────────────────────────────────────────────
  'locksmith': [
    { emoji: '🔑', label: 'Locked out of home' },
    { emoji: '🚗', label: 'Locked out of car' },
    { emoji: '🔄', label: 'Need to rekey locks' },
    { emoji: '🔒', label: 'New locks / deadbolts' },
    { emoji: '🎮', label: 'Smart lock / keypad install' },
    { emoji: '🔐', label: 'Safe or vault service' },
    { emoji: '🏢', label: 'Commercial building' },
    { emoji: '🚨', label: 'Break-in / security concern' },
  ],

  // ── CLEANING ────────────────────────────────────────────────────────────
  'cleaning': [
    { emoji: '🔄', label: 'Regular / recurring service' },
    { emoji: '🔍', label: 'Deep clean (one-time)' },
    { emoji: '📦', label: 'Move-in or move-out clean' },
    { emoji: '🏗️', label: 'Post-construction cleaning' },
    { emoji: '🏢', label: 'Commercial / office' },
    { emoji: '🐾', label: 'Pet hair / odors' },
    { emoji: '⏰', label: 'Same-day or rush needed' },
    { emoji: '🧹', label: 'Specific rooms only' },
  ],

  // ── CARPET CLEANING ─────────────────────────────────────────────────────
  'carpet cleaning': [
    { emoji: '🏠', label: 'Whole home' },
    { emoji: '🛋️', label: 'Upholstery / sofa too' },
    { emoji: '🐾', label: 'Pet stains / odors' },
    { emoji: '💧', label: 'Water / flood damage' },
    { emoji: '🏢', label: 'Commercial / office' },
    { emoji: '🔍', label: 'Specific stain removal' },
    { emoji: '⏰', label: 'Same-day service needed' },
    { emoji: '🧹', label: 'Tile & grout too' },
  ],

  // ── PAINTING ────────────────────────────────────────────────────────────
  'painting': [
    { emoji: '🏠', label: 'Interior painting' },
    { emoji: '🏚️', label: 'Exterior painting' },
    { emoji: '🚪', label: 'Cabinets / furniture refinish' },
    { emoji: '🔄', label: 'Full repaint / color change' },
    { emoji: '✅', label: 'Includes prep work needed' },
    { emoji: '🏢', label: 'Commercial / office space' },
    { emoji: '🌿', label: 'Low-VOC / eco-friendly' },
    { emoji: '📐', label: 'Detailed trim / accent work' },
  ],

  // ── LANDSCAPING ─────────────────────────────────────────────────────────
  'landscaping': [
    { emoji: '🌿', label: 'Regular lawn maintenance' },
    { emoji: '🌳', label: 'Tree trimming or removal' },
    { emoji: '💧', label: 'Irrigation / sprinkler system' },
    { emoji: '🏗️', label: 'Full landscape redesign' },
    { emoji: '🍂', label: 'One-time cleanup' },
    { emoji: '🌸', label: 'Garden / planting design' },
    { emoji: '🏢', label: 'Commercial property' },
    { emoji: '⚡', label: 'After storm cleanup' },
  ],

  // ── PEST CONTROL ────────────────────────────────────────────────────────
  'pest control': [
    { emoji: '🐜', label: 'Ants or cockroaches' },
    { emoji: '🐭', label: 'Rodents / mice / rats' },
    { emoji: '🐛', label: 'Termites' },
    { emoji: '🐝', label: 'Bees / wasps / hornets' },
    { emoji: '🛏️', label: 'Bed bugs' },
    { emoji: '🦝', label: 'Wildlife / animal removal' },
    { emoji: '🔄', label: 'Ongoing prevention plan' },
    { emoji: '🏢', label: 'Commercial building' },
  ],

  // ── APPLIANCE REPAIR ────────────────────────────────────────────────────
  'appliance repair': [
    { emoji: '❄️', label: 'Refrigerator / freezer' },
    { emoji: '🫧', label: 'Washer / dryer' },
    { emoji: '🍽️', label: 'Dishwasher' },
    { emoji: '🍳', label: 'Oven / stove / range' },
    { emoji: '🧊', label: 'Ice maker' },
    { emoji: '📦', label: 'Multiple appliances' },
    { emoji: '🏢', label: 'Commercial equipment' },
    { emoji: '🚨', label: 'Not working at all' },
  ],

  // ── HANDYMAN ────────────────────────────────────────────────────────────
  'handyman': [
    { emoji: '🛋️', label: 'Furniture assembly' },
    { emoji: '📺', label: 'TV mounting' },
    { emoji: '🧱', label: 'Drywall repair' },
    { emoji: '🪟', label: 'Door or window fix' },
    { emoji: '🏚️', label: 'Deck / outdoor repair' },
    { emoji: '📦', label: 'Multiple small tasks' },
    { emoji: '🏢', label: 'Commercial / office' },
    { emoji: '🔧', label: 'General home maintenance' },
  ],

  // ── SOLAR & ENERGY ──────────────────────────────────────────────────────
  'solar & energy': [
    { emoji: '🏠', label: 'Residential home' },
    { emoji: '🏢', label: 'Commercial building' },
    { emoji: '🔋', label: 'Battery storage too' },
    { emoji: '💰', label: 'Interested in tax incentives' },
    { emoji: '🔄', label: 'Replacing old system' },
    { emoji: '📊', label: 'Want energy audit first' },
    { emoji: '⚡', label: 'Fast installation needed' },
    { emoji: '🌍', label: 'Off-grid interest' },
  ],

  // ── MOVING COMPANIES ────────────────────────────────────────────────────
  'moving companies': [
    { emoji: '🏠', label: 'Local move (same city)' },
    { emoji: '🌍', label: 'Long distance move' },
    { emoji: '📦', label: 'Packing help needed too' },
    { emoji: '🏢', label: 'Office / commercial move' },
    { emoji: '🛋️', label: 'Large or heavy items' },
    { emoji: '🔑', label: 'Storage needed' },
    { emoji: '📅', label: 'Flexible on date' },
    { emoji: '⚡', label: 'Need to move fast' },
  ],

  // ── POOL SERVICE ────────────────────────────────────────────────────────
  'pool service': [
    { emoji: '🔄', label: 'Weekly maintenance' },
    { emoji: '🧪', label: 'Chemical / water issue' },
    { emoji: '⚙️', label: 'Pump or filter problem' },
    { emoji: '🔥', label: 'Heater repair' },
    { emoji: '💧', label: 'Leak suspected' },
    { emoji: '✨', label: 'Opening / closing seasonal' },
    { emoji: '🏗️', label: 'Renovation / resurfacing' },
    { emoji: '🏢', label: 'Commercial / hotel pool' },
  ],

  // ── CHIMNEY SWEEP ───────────────────────────────────────────────────────
  'chimney sweep': [
    { emoji: '🧹', label: 'Annual cleaning / sweeping' },
    { emoji: '🔍', label: 'Inspection needed' },
    { emoji: '💧', label: 'Water leak / damage' },
    { emoji: '🦝', label: 'Animal / debris removal' },
    { emoji: '🔥', label: 'Smoke backing up inside' },
    { emoji: '🏗️', label: 'Rebuild / repair needed' },
    { emoji: '🛡️', label: 'Waterproofing / sealing' },
    { emoji: '🪟', label: 'Cap or damper issue' },
  ],

  // ── AIR DUCT CLEANING ───────────────────────────────────────────────────
  'air duct cleaning': [
    { emoji: '🤧', label: 'Allergy / air quality issue' },
    { emoji: '🦠', label: 'Mold suspicion in ducts' },
    { emoji: '🐛', label: 'Pest infestation in ducts' },
    { emoji: '👃', label: 'Strange smell from vents' },
    { emoji: '🔄', label: 'Never been cleaned before' },
    { emoji: '🧺', label: 'Dryer vent too' },
    { emoji: '🏢', label: 'Commercial building' },
    { emoji: '🏗️', label: 'Post-construction cleaning' },
  ],

  // ── WINDOWS & DOORS ─────────────────────────────────────────────────────
  'windows & doors': [
    { emoji: '🪟', label: 'Window replacement' },
    { emoji: '🚪', label: 'Door replacement' },
    { emoji: '💨', label: 'Drafty / energy loss' },
    { emoji: '💧', label: 'Leaking / condensation' },
    { emoji: '🔒', label: 'Security upgrade' },
    { emoji: '🏗️', label: 'New construction' },
    { emoji: '📦', label: 'Multiple windows / doors' },
    { emoji: '🛡️', label: 'Storm / impact resistant' },
  ],

  // ── FLOORING ────────────────────────────────────────────────────────────
  'flooring': [
    { emoji: '🪵', label: 'Hardwood' },
    { emoji: '🏗️', label: 'Tile / stone' },
    { emoji: '📦', label: 'Laminate / vinyl plank' },
    { emoji: '🧹', label: 'Carpet' },
    { emoji: '🔄', label: 'Refinishing / resurfacing' },
    { emoji: '📐', label: 'Whole home / large area' },
    { emoji: '🏢', label: 'Commercial space' },
    { emoji: '💧', label: 'Water / flood damage repair' },
  ],

  // ── DECK & PATIO ────────────────────────────────────────────────────────
  'deck & patio': [
    { emoji: '🔨', label: 'New build wanted' },
    { emoji: '🩹', label: 'Repair existing deck' },
    { emoji: '🎨', label: 'Staining / sealing' },
    { emoji: '🏗️', label: 'Pergola or cover too' },
    { emoji: '🪵', label: 'Wood preferred' },
    { emoji: '✨', label: 'Composite preferred' },
    { emoji: '📐', label: 'Has measurements ready' },
    { emoji: '✅', label: 'Ready to start soon' },
  ],

  // ── DRYWALL ─────────────────────────────────────────────────────────────
  'drywall': [
    { emoji: '🕳️', label: 'Holes to patch' },
    { emoji: '💧', label: 'Water damage repair' },
    { emoji: '🏗️', label: 'New install / remodel' },
    { emoji: '🧱', label: 'Ceiling work included' },
    { emoji: '🎨', label: 'Paint-ready finish needed' },
    { emoji: '🏢', label: 'Commercial space' },
    { emoji: '⏰', label: 'Quick turnaround needed' },
  ],

  // ── EV CHARGER INSTALLATION ─────────────────────────────────────────────
  'ev charger installation': [
    { emoji: '🚗', label: 'EV already owned' },
    { emoji: '📦', label: 'Charger already purchased' },
    { emoji: '🔌', label: 'Panel may need upgrade' },
    { emoji: '🏠', label: 'Garage installation' },
    { emoji: '🌧️', label: 'Outdoor install' },
    { emoji: '🏢', label: 'Business / workplace install' },
    { emoji: '⚡', label: 'Wants install this week' },
  ],

  // ── FENCING ─────────────────────────────────────────────────────────────
  'fencing': [
    { emoji: '🆕', label: 'Brand new fence' },
    { emoji: '🩹', label: 'Repair existing fence' },
    { emoji: '🐕', label: 'For pets / kids' },
    { emoji: '🔒', label: 'Privacy fence wanted' },
    { emoji: '🪵', label: 'Wood preferred' },
    { emoji: '⛓️', label: 'Chain link / metal' },
    { emoji: '🏢', label: 'Commercial property' },
    { emoji: '📐', label: 'Yard already measured' },
  ],

  // ── GENERAL CONTRACTOR ──────────────────────────────────────────────────
  'general contractor': [
    { emoji: '🍳', label: 'Kitchen remodel' },
    { emoji: '🛁', label: 'Bathroom remodel' },
    { emoji: '🏠', label: 'Whole home renovation' },
    { emoji: '➕', label: 'Addition / extension' },
    { emoji: '📋', label: 'Has plans / permits' },
    { emoji: '💰', label: 'Budget over $50k' },
    { emoji: '🏢', label: 'Commercial project' },
    { emoji: '⏰', label: 'Wants to start ASAP' },
  ],

  // ── GENERATOR INSTALLATION ──────────────────────────────────────────────
  'generator installation': [
    { emoji: '⚡', label: 'Recent power outages' },
    { emoji: '🏠', label: 'Whole-home standby wanted' },
    { emoji: '🔌', label: 'Portable hookup only' },
    { emoji: '🛒', label: 'Generator already purchased' },
    { emoji: '⛽', label: 'Natural gas available' },
    { emoji: '🩹', label: 'Repair existing unit' },
    { emoji: '🏢', label: 'Commercial / business' },
  ],

  // ── GUTTERS ─────────────────────────────────────────────────────────────
  'gutters': [
    { emoji: '💧', label: 'Overflowing / leaking' },
    { emoji: '🍂', label: 'Clogged — needs cleaning' },
    { emoji: '🆕', label: 'Full replacement wanted' },
    { emoji: '🛡️', label: 'Wants gutter guards' },
    { emoji: '🏠', label: 'Two-story home' },
    { emoji: '💥', label: 'Storm damage' },
    { emoji: '✅', label: 'Ready to schedule' },
  ],

  // ── IRRIGATION SYSTEMS ──────────────────────────────────────────────────
  'irrigation systems': [
    { emoji: '🆕', label: 'New system install' },
    { emoji: '🩹', label: 'Repair — zones not working' },
    { emoji: '💧', label: 'Leak suspected' },
    { emoji: '❄️', label: 'Winterization / blowout' },
    { emoji: '🌱', label: 'New landscaping going in' },
    { emoji: '📱', label: 'Wants smart controller' },
    { emoji: '🏢', label: 'Commercial property' },
  ],

  // ── JUNK REMOVAL ────────────────────────────────────────────────────────
  'junk removal': [
    { emoji: '🛋️', label: 'Furniture / large items' },
    { emoji: '🏚️', label: 'Full cleanout (garage / estate)' },
    { emoji: '🏗️', label: 'Construction debris' },
    { emoji: '🌿', label: 'Yard waste' },
    { emoji: '📦', label: 'Single item pickup' },
    { emoji: '🏢', label: 'Office / commercial' },
    { emoji: '⏰', label: 'Same-day pickup wanted' },
  ],

  // ── LAWN CARE ───────────────────────────────────────────────────────────
  'lawn care': [
    { emoji: '🔄', label: 'Weekly / recurring service' },
    { emoji: '1️⃣', label: 'One-time cleanup' },
    { emoji: '🌱', label: 'Fertilization / treatment' },
    { emoji: '🍂', label: 'Leaf removal' },
    { emoji: '🌾', label: 'Overgrown lawn' },
    { emoji: '🏢', label: 'Commercial property' },
    { emoji: '📅', label: 'Season-long contract wanted' },
  ],

  // ── PRESSURE WASHING ────────────────────────────────────────────────────
  'pressure washing': [
    { emoji: '🏠', label: 'House / siding wash' },
    { emoji: '🚗', label: 'Driveway & walkways' },
    { emoji: '🪵', label: 'Deck or patio' },
    { emoji: '🧱', label: 'Roof wash needed' },
    { emoji: '🦠', label: 'Mold / mildew buildup' },
    { emoji: '🏢', label: 'Commercial building' },
    { emoji: '🏡', label: 'Prepping to sell / paint' },
  ],

  // ── SIDING ──────────────────────────────────────────────────────────────
  'siding': [
    { emoji: '💥', label: 'Storm / wind damage' },
    { emoji: '🩹', label: 'Repair small section' },
    { emoji: '🔄', label: 'Full replacement' },
    { emoji: '🎨', label: 'Vinyl preferred' },
    { emoji: '🧱', label: 'Fiber cement / Hardie' },
    { emoji: '🏠', label: 'Two-story home' },
    { emoji: '🛡️', label: 'Insurance claim involved' },
  ],

  // ── SMART HOME & AUTOMATION ─────────────────────────────────────────────
  'smart home & automation': [
    { emoji: '📷', label: 'Security cameras wanted' },
    { emoji: '🔔', label: 'Video doorbell' },
    { emoji: '🌡️', label: 'Smart thermostat' },
    { emoji: '💡', label: 'Smart lighting' },
    { emoji: '🎬', label: 'Home theater / audio' },
    { emoji: '📶', label: 'Wi-Fi network issues' },
    { emoji: '🆕', label: 'New construction pre-wire' },
    { emoji: '🏢', label: 'Business / office' },
  ],

  // ── SNOW REMOVAL ────────────────────────────────────────────────────────
  'snow removal': [
    { emoji: '❄️', label: 'Storm coming — urgent' },
    { emoji: '🔄', label: 'Seasonal contract wanted' },
    { emoji: '🚗', label: 'Driveway only' },
    { emoji: '🚶', label: 'Sidewalks included' },
    { emoji: '🧊', label: 'Ice / salting needed' },
    { emoji: '🏠', label: 'Roof snow removal' },
    { emoji: '🏢', label: 'Commercial lot' },
  ],

  // ── TREE SERVICE ────────────────────────────────────────────────────────
  'tree service': [
    { emoji: '🌳', label: 'Large tree removal' },
    { emoji: '✂️', label: 'Trimming / pruning' },
    { emoji: '🪵', label: 'Stump grinding' },
    { emoji: '⛈️', label: 'Storm damage — urgent' },
    { emoji: '🏠', label: 'Tree near house / wires' },
    { emoji: '🌴', label: 'Multiple trees' },
    { emoji: '🏢', label: 'Commercial property' },
    { emoji: '📋', label: 'May need permit' },
  ],

  // ═══ REAL ESTATE ═════════════════════════════════════════════════════════

  // ── REAL ESTATE AGENTS ──────────────────────────────────────────────────
  'real estate agents': [
    { emoji: '💰', label: 'Pre-approved buyer' },
    { emoji: '💵', label: 'Cash offer' },
    { emoji: '🆕', label: 'First-time buyer' },
    { emoji: '🔑', label: 'Investment property' },
    { emoji: '⚡', label: 'Need to sell fast' },
    { emoji: '🏚️', label: 'Property needs repairs' },
    { emoji: '🐾', label: 'Pet-friendly home needed' },
    { emoji: '🔄', label: 'Relocating to area' },
  ],

  // ── PROPERTY MANAGEMENT ─────────────────────────────────────────────────
  'property management': [
    { emoji: '📦', label: 'Multiple properties' },
    { emoji: '🏢', label: 'Commercial building' },
    { emoji: '🏠', label: 'Single family / condo' },
    { emoji: '🔑', label: 'Tenant placement needed' },
    { emoji: '🔄', label: 'Switching management company' },
    { emoji: '🧹', label: 'Maintenance coverage needed' },
    { emoji: '💰', label: 'Rental income optimization' },
    { emoji: '📋', label: 'Short-term / vacation rental' },
  ],

  // ── HOME BUYERS / CASH OFFERS ───────────────────────────────────────────
  'home buyers (cash offers)': [
    { emoji: '⚡', label: 'Need to close fast' },
    { emoji: '🏚️', label: 'Property needs major repairs' },
    { emoji: '👴', label: 'Estate / inherited property' },
    { emoji: '📦', label: 'Behind on payments / foreclosure' },
    { emoji: '🔄', label: 'Divorce / life change' },
    { emoji: '🌍', label: 'Relocating / must sell' },
    { emoji: '🏢', label: 'Commercial or multi-unit' },
    { emoji: '📋', label: 'Already listed — no offers' },
  ],

  // ── REAL ESTATE INVESTORS ───────────────────────────────────────────────
  'real estate investors': [
    { emoji: '🏚️', label: 'Distressed property' },
    { emoji: '💵', label: 'Cash buyer ready' },
    { emoji: '⚡', label: 'Quick close wanted' },
    { emoji: '🏠', label: 'Off-market deal' },
    { emoji: '📦', label: 'Multiple properties' },
    { emoji: '🔨', label: 'Fix & flip opportunity' },
    { emoji: '🏦', label: 'Financing lined up' },
    { emoji: '🤝', label: 'Open to creative terms' },
  ],

  // ── COMMERCIAL REAL ESTATE ──────────────────────────────────────────────
  'commercial real estate': [
    { emoji: '🏢', label: 'Office space' },
    { emoji: '🛍️', label: 'Retail / storefront' },
    { emoji: '🏭', label: 'Industrial / warehouse' },
    { emoji: '💵', label: 'Budget $1M+' },
    { emoji: '📄', label: 'Lease (not purchase)' },
    { emoji: '📈', label: 'Investment / income property' },
    { emoji: '⏰', label: 'Timeline under 3 months' },
    { emoji: '🆕', label: 'First commercial deal' },
  ],

  // ── LAND BUYERS ─────────────────────────────────────────────────────────
  'land buyers': [
    { emoji: '🌲', label: 'Rural / acreage' },
    { emoji: '🏗️', label: 'Development potential' },
    { emoji: '💵', label: 'Cash sale wanted' },
    { emoji: '📋', label: 'Zoning questions' },
    { emoji: '⚡', label: 'Motivated to sell fast' },
    { emoji: '👴', label: 'Inherited land' },
    { emoji: '🗺️', label: 'Multiple parcels' },
    { emoji: '💧', label: 'Utilities available' },
  ],

  // ── SHORT-TERM RENTAL MANAGEMENT ────────────────────────────────────────
  'short-term rental management': [
    { emoji: '🏠', label: 'Property ready to list' },
    { emoji: '📱', label: 'Already on Airbnb / VRBO' },
    { emoji: '🆕', label: 'New to short-term rentals' },
    { emoji: '🧹', label: 'Cleaning / turnover needed' },
    { emoji: '💰', label: 'Underperforming listing' },
    { emoji: '🌴', label: 'Vacation market property' },
    { emoji: '📦', label: 'Multiple properties' },
    { emoji: '🔄', label: 'Switching managers' },
  ],

  // ── MORTGAGE BROKERS ────────────────────────────────────────────────────
  'mortgage brokers': [
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair credit (600–699)' },
    { emoji: '🔄', label: 'Refinancing existing mortgage' },
    { emoji: '🆕', label: 'First-time homebuyer' },
    { emoji: '🏢', label: 'Investment / rental property' },
    { emoji: '💵', label: 'Large loan ($500k+)' },
    { emoji: '🏦', label: 'Self-employed / non-W2 income' },
    { emoji: '⚡', label: 'Need to close fast' },
  ],

  // ── HOME INSPECTION ─────────────────────────────────────────────────────
  'home inspection': [
    { emoji: '📋', label: 'Under contract — deadline' },
    { emoji: '🏠', label: 'Pre-listing inspection' },
    { emoji: '🆕', label: 'New construction walkthrough' },
    { emoji: '🕳️', label: 'Specific concern (roof / foundation)' },
    { emoji: '🧪', label: 'Radon / mold testing too' },
    { emoji: '🏢', label: 'Multi-unit property' },
    { emoji: '⚡', label: 'Needed within days' },
    { emoji: '💰', label: 'Getting quotes' },
  ],

  // ═══ FINANCIAL SERVICES ══════════════════════════════════════════════════

  // ── MORTGAGE & HOME LOANS ───────────────────────────────────────────────
  'mortgage & home loans': [
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair credit (600–699)' },
    { emoji: '🔄', label: 'Refinancing existing mortgage' },
    { emoji: '🆕', label: 'First-time homebuyer' },
    { emoji: '🏢', label: 'Investment / rental property' },
    { emoji: '💵', label: 'Large loan ($500k+)' },
    { emoji: '🏦', label: 'Self-employed / non-W2 income' },
    { emoji: '⚡', label: 'Need to close fast' },
  ],

  // ── AUTO LOANS ──────────────────────────────────────────────────────────
  'auto loans': [
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair / poor credit' },
    { emoji: '🆕', label: 'New vehicle purchase' },
    { emoji: '🔄', label: 'Refinancing existing auto loan' },
    { emoji: '🚗', label: 'Vehicle already chosen' },
    { emoji: '🏢', label: 'Business / commercial vehicle' },
    { emoji: '⚡', label: 'Need approval fast' },
    { emoji: '💵', label: 'Large amount ($40k+)' },
  ],

  // ── PERSONAL LOANS ──────────────────────────────────────────────────────
  'personal loans': [
    { emoji: '💳', label: 'Debt consolidation' },
    { emoji: '🏠', label: 'Home improvement' },
    { emoji: '🏥', label: 'Medical bills' },
    { emoji: '💼', label: 'Business purposes' },
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair / poor credit' },
    { emoji: '⚡', label: 'Funds needed quickly' },
    { emoji: '💵', label: 'Large amount ($20k+)' },
  ],

  // ── BUSINESS LOANS ──────────────────────────────────────────────────────
  'business loans': [
    { emoji: '🚀', label: 'New business / startup' },
    { emoji: '📈', label: 'Established 2+ years' },
    { emoji: '💵', label: 'Needs funding this week' },
    { emoji: '🏦', label: 'Bank declined them' },
    { emoji: '📄', label: 'Has financials ready' },
    { emoji: '💳', label: 'Fair / building credit' },
    { emoji: '🔁', label: 'Refinancing existing debt' },
  ],

  // ── DEBT CONSOLIDATION ──────────────────────────────────────────────────
  'debt consolidation': [
    { emoji: '💳', label: 'Multiple credit cards' },
    { emoji: '🏥', label: 'Medical debt included' },
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair / poor credit' },
    { emoji: '💵', label: 'Large total debt ($20k+)' },
    { emoji: '⚡', label: 'Struggling with payments now' },
    { emoji: '🔄', label: 'Tried other options before' },
    { emoji: '🏠', label: 'Homeowner / has equity' },
  ],

  // ── LIFE INSURANCE ──────────────────────────────────────────────────────
  'life insurance': [
    { emoji: '👶', label: 'Young / healthy applicant' },
    { emoji: '👨‍👩‍👧', label: 'Family coverage needed' },
    { emoji: '💼', label: 'Business / key man policy' },
    { emoji: '🔄', label: 'Replacing existing policy' },
    { emoji: '💵', label: 'Large coverage ($500k+)' },
    { emoji: '🆕', label: 'No current coverage' },
    { emoji: '🏥', label: 'Health conditions present' },
    { emoji: '⚡', label: 'Needs coverage quickly' },
  ],

  // ── AUTO INSURANCE ──────────────────────────────────────────────────────
  'auto insurance': [
    { emoji: '🚗', label: 'New vehicle just purchased' },
    { emoji: '👨‍👩‍👧', label: 'Adding a driver' },
    { emoji: '🔄', label: 'Switching providers' },
    { emoji: '💥', label: 'Recent accident / SR-22 needed' },
    { emoji: '🏢', label: 'Commercial / business vehicle' },
    { emoji: '⚡', label: 'Lapse in coverage' },
    { emoji: '🏎️', label: 'Classic / specialty vehicle' },
    { emoji: '💰', label: 'Looking for lowest rate' },
  ],

  // ── HOME INSURANCE ──────────────────────────────────────────────────────
  'home insurance': [
    { emoji: '🆕', label: 'New home purchase' },
    { emoji: '🔄', label: 'Switching providers' },
    { emoji: '🏚️', label: 'Older home (20+ years)' },
    { emoji: '🌊', label: 'Flood / special coverage needed' },
    { emoji: '💰', label: 'Looking for lowest rate' },
    { emoji: '💥', label: 'Recent claim on record' },
    { emoji: '🏢', label: 'Investment / rental property' },
    { emoji: '🐾', label: 'Pets / liability concern' },
  ],

  // ── HEALTH INSURANCE ────────────────────────────────────────────────────
  'health insurance': [
    { emoji: '🆕', label: 'No current coverage' },
    { emoji: '🔄', label: 'Open enrollment / switching' },
    { emoji: '👶', label: 'Covering children too' },
    { emoji: '💰', label: 'Looking for low premium' },
    { emoji: '🏥', label: 'Pre-existing conditions' },
    { emoji: '💼', label: 'Small business / group plan' },
    { emoji: '👴', label: 'Medicare age (65+)' },
    { emoji: '⚡', label: 'Qualifying life event' },
  ],

  // ── COMMERCIAL INSURANCE ────────────────────────────────────────────────
  'commercial insurance': [
    { emoji: '🆕', label: 'New business — first policy' },
    { emoji: '🔄', label: 'Switching / shopping rates' },
    { emoji: '👷', label: 'Contractor needing COI' },
    { emoji: '🏢', label: 'Has commercial property' },
    { emoji: '🚚', label: 'Company vehicles to cover' },
    { emoji: '👥', label: 'Has employees (workers comp)' },
    { emoji: '⚡', label: 'Needs coverage this week' },
    { emoji: '📋', label: 'Certificate needed for contract' },
  ],

  // ── EQUIPMENT FINANCING ─────────────────────────────────────────────────
  'equipment financing': [
    { emoji: '🚜', label: 'Construction equipment' },
    { emoji: '🚛', label: 'Truck / trailer' },
    { emoji: '🏥', label: 'Medical equipment' },
    { emoji: '🍽️', label: 'Restaurant equipment' },
    { emoji: '🆕', label: 'New business / startup' },
    { emoji: '📈', label: 'Established 2+ years' },
    { emoji: '💳', label: 'Fair / building credit' },
    { emoji: '⚡', label: 'Needs funding fast' },
  ],

  // ── FINANCIAL PLANNING ──────────────────────────────────────────────────
  'financial planning': [
    { emoji: '👴', label: 'Retirement planning focus' },
    { emoji: '📈', label: 'Investment management' },
    { emoji: '👶', label: 'College savings' },
    { emoji: '🏠', label: 'Recent windfall / inheritance' },
    { emoji: '💼', label: 'Business owner' },
    { emoji: '💵', label: '$250k+ investable assets' },
    { emoji: '🔄', label: 'Switching advisors' },
    { emoji: '🆕', label: 'First-time planning' },
  ],

  // ── HARD MONEY LOANS ────────────────────────────────────────────────────
  'hard money loans': [
    { emoji: '🏚️', label: 'Fix & flip project' },
    { emoji: '🌉', label: 'Bridge loan needed' },
    { emoji: '🏠', label: 'Rental / DSCR deal' },
    { emoji: '🏗️', label: 'New construction' },
    { emoji: '⚡', label: 'Needs to close fast' },
    { emoji: '📄', label: 'Property under contract' },
    { emoji: '🔁', label: 'Experienced investor' },
    { emoji: '🆕', label: 'First investment deal' },
  ],

  // ── INVOICE FACTORING ───────────────────────────────────────────────────
  'invoice factoring': [
    { emoji: '🚛', label: 'Trucking / freight company' },
    { emoji: '👥', label: 'Staffing agency' },
    { emoji: '🏗️', label: 'Construction business' },
    { emoji: '💵', label: 'Slow-paying customers' },
    { emoji: '📄', label: 'Large invoices outstanding' },
    { emoji: '🆕', label: 'New to factoring' },
    { emoji: '🔄', label: 'Switching factoring companies' },
    { emoji: '⚡', label: 'Cash flow crunch now' },
  ],

  // ── LINE OF CREDIT ──────────────────────────────────────────────────────
  'line of credit': [
    { emoji: '🏢', label: 'Business line wanted' },
    { emoji: '🏠', label: 'HELOC / home equity' },
    { emoji: '💵', label: 'Backup cash cushion' },
    { emoji: '📈', label: 'Established business' },
    { emoji: '🆕', label: 'Startup / new business' },
    { emoji: '💳', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair / building credit' },
    { emoji: '⚡', label: 'Needs access this week' },
  ],

  // ── MERCHANT CASH ADVANCE ───────────────────────────────────────────────
  'merchant cash advance': [
    { emoji: '💳', label: 'Strong card sales volume' },
    { emoji: '⚡', label: 'Same-day funding wanted' },
    { emoji: '🏦', label: 'Bank declined them' },
    { emoji: '🔁', label: 'Has existing advance(s)' },
    { emoji: '💵', label: '$50k+ needed' },
    { emoji: '🍽️', label: 'Restaurant / retail business' },
    { emoji: '📈', label: 'Revenue growing' },
    { emoji: '🔄', label: 'Wants to consolidate MCAs' },
  ],

  // ── PAYROLL SERVICES ────────────────────────────────────────────────────
  'payroll services': [
    { emoji: '🆕', label: 'First employee(s) hired' },
    { emoji: '🔄', label: 'Switching providers' },
    { emoji: '👥', label: '10+ employees' },
    { emoji: '🧾', label: 'Contractors / 1099s too' },
    { emoji: '🏥', label: 'Benefits admin needed' },
    { emoji: '⏰', label: 'Time tracking wanted' },
    { emoji: '📋', label: 'Payroll tax issues' },
    { emoji: '💼', label: 'Multi-state employees' },
  ],

  // ── REFINANCING ─────────────────────────────────────────────────────────
  'refinancing': [
    { emoji: '📉', label: 'Wants lower rate / payment' },
    { emoji: '💵', label: 'Cash-out for projects' },
    { emoji: '🏠', label: 'Significant home equity' },
    { emoji: '💳', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Credit has improved' },
    { emoji: '🔄', label: 'Wants to remove PMI' },
    { emoji: '🚗', label: 'Auto refinance' },
    { emoji: '⚡', label: 'Wants to lock rate soon' },
  ],

  // ── SBA LOANS ───────────────────────────────────────────────────────────
  'sba loans': [
    { emoji: '🏢', label: 'Established 2+ years' },
    { emoji: '🆕', label: 'Startup / acquisition' },
    { emoji: '🏠', label: 'Buying commercial property' },
    { emoji: '💵', label: '$350k+ needed' },
    { emoji: '📄', label: 'Financials ready' },
    { emoji: '🏦', label: 'Bank declined conventional' },
    { emoji: '💳', label: 'Good personal credit' },
    { emoji: '🔁', label: 'Refinancing existing debt' },
  ],

  // ── TAX RELIEF & RESOLUTION ─────────────────────────────────────────────
  'tax relief & resolution': [
    { emoji: '📋', label: 'Owes IRS back taxes' },
    { emoji: '💵', label: 'Owes $10k+' },
    { emoji: '📬', label: 'Received IRS notices' },
    { emoji: '🚨', label: 'Garnishment / levy active' },
    { emoji: '📄', label: 'Unfiled returns' },
    { emoji: '🏢', label: 'Business tax debt' },
    { emoji: '🤝', label: 'Wants settlement (OIC)' },
    { emoji: '⚡', label: 'Deadline approaching' },
  ],

  // ── BOOKKEEPING & ACCOUNTING ────────────────────────────────────────────
  'bookkeeping & accounting': [
    { emoji: '🆕', label: 'Startup / new business' },
    { emoji: '🏢', label: 'Established business' },
    { emoji: '🔄', label: 'Ongoing monthly service' },
    { emoji: '📋', label: 'Catch-up / backlog needed' },
    { emoji: '💼', label: 'Payroll included' },
    { emoji: '📊', label: 'Financial reporting needed' },
    { emoji: '⚡', label: 'Tax season urgent' },
    { emoji: '💰', label: 'Budget-conscious' },
  ],

  // ═══ LEGAL SERVICES ══════════════════════════════════════════════════════

  // ── PERSONAL INJURY ─────────────────────────────────────────────────────
  'personal injury': [
    { emoji: '🚗', label: 'Car accident' },
    { emoji: '⚠️', label: 'Slip and fall' },
    { emoji: '🏥', label: 'Medical malpractice' },
    { emoji: '👷', label: 'Workplace injury' },
    { emoji: '🏚️', label: 'Premises liability' },
    { emoji: '⚡', label: 'Injury is recent (within 30 days)' },
    { emoji: '🏥', label: 'Currently receiving treatment' },
    { emoji: '📋', label: 'Insurance already involved' },
  ],

  // ── CRIMINAL DEFENSE ────────────────────────────────────────────────────
  'criminal defense': [
    { emoji: '🚗', label: 'DUI / DWI charge' },
    { emoji: '⚡', label: 'Arrest is recent' },
    { emoji: '📋', label: 'Arraignment / hearing coming' },
    { emoji: '🔄', label: 'Prior offense on record' },
    { emoji: '🧑', label: 'Juvenile case' },
    { emoji: '💼', label: 'White collar / fraud charge' },
    { emoji: '🚨', label: 'Facing felony charge' },
    { emoji: '💰', label: 'Budget-conscious' },
  ],

  // ── FAMILY LAW & DIVORCE ────────────────────────────────────────────────
  'family law & divorce': [
    { emoji: '📋', label: 'Uncontested / both agree' },
    { emoji: '⚡', label: 'Contested / complex case' },
    { emoji: '👶', label: 'Children involved' },
    { emoji: '🏠', label: 'Real estate / property to split' },
    { emoji: '💼', label: 'Business assets involved' },
    { emoji: '🔄', label: 'Modifying existing order' },
    { emoji: '🚨', label: 'Domestic violence concern' },
    { emoji: '⏰', label: 'Need to file quickly' },
  ],

  // ── IMMIGRATION LAW ─────────────────────────────────────────────────────
  'immigration law': [
    { emoji: '📋', label: 'Green card application' },
    { emoji: '💼', label: 'Work visa / H-1B' },
    { emoji: '👨‍👩‍👧', label: 'Family petition' },
    { emoji: '🏡', label: 'Citizenship / naturalization' },
    { emoji: '⚡', label: 'Removal / deportation defense' },
    { emoji: '🛡️', label: 'Asylum case' },
    { emoji: '🔄', label: 'Status adjustment' },
    { emoji: '⏰', label: 'Urgent timeline' },
  ],

  // ── BANKRUPTCY ──────────────────────────────────────────────────────────
  'bankruptcy': [
    { emoji: '💳', label: 'Overwhelming credit card debt' },
    { emoji: '🏥', label: 'Medical debt' },
    { emoji: '🏠', label: 'Facing foreclosure' },
    { emoji: '🚨', label: 'Wage garnishment active' },
    { emoji: '📞', label: 'Creditor calls nonstop' },
    { emoji: '💼', label: 'Business debts involved' },
    { emoji: '🆕', label: 'First-time filing' },
    { emoji: '⚡', label: 'Court deadline coming' },
  ],

  // ── BUSINESS FORMATION ──────────────────────────────────────────────────
  'business formation': [
    { emoji: '🆕', label: 'Starting first business' },
    { emoji: '🏢', label: 'LLC wanted' },
    { emoji: '📋', label: 'Corporation / S-Corp' },
    { emoji: '🤝', label: 'Has business partner(s)' },
    { emoji: '📄', label: 'Contracts need drafting' },
    { emoji: '™️', label: 'Trademark too' },
    { emoji: '⚡', label: 'Launching soon' },
    { emoji: '💼', label: 'Converting existing entity' },
  ],

  // ── DUI DEFENSE ─────────────────────────────────────────────────────────
  'dui defense': [
    { emoji: '⚡', label: 'Arrested within days' },
    { emoji: '1️⃣', label: 'First offense' },
    { emoji: '🔄', label: 'Repeat offense' },
    { emoji: '📋', label: 'Court date scheduled' },
    { emoji: '🪪', label: 'License suspension pending' },
    { emoji: '🚛', label: 'CDL / drives for work' },
    { emoji: '🧪', label: 'Refused breath test' },
    { emoji: '💰', label: 'Payment plan needed' },
  ],

  // ── ESTATE PLANNING ─────────────────────────────────────────────────────
  'estate planning': [
    { emoji: '📄', label: 'No will yet' },
    { emoji: '🔄', label: 'Updating old documents' },
    { emoji: '👨‍👩‍👧', label: 'Minor children to protect' },
    { emoji: '🏠', label: 'Owns real estate' },
    { emoji: '💼', label: 'Business owner' },
    { emoji: '👴', label: "Parent's estate / probate" },
    { emoji: '🏥', label: 'Health event prompting this' },
    { emoji: '💵', label: 'Larger estate ($1M+)' },
  ],

  // ── MEDICAL MALPRACTICE ─────────────────────────────────────────────────
  'medical malpractice': [
    { emoji: '🏥', label: 'Surgical error' },
    { emoji: '🩺', label: 'Misdiagnosis' },
    { emoji: '👶', label: 'Birth injury' },
    { emoji: '💊', label: 'Medication error' },
    { emoji: '👴', label: 'Nursing home neglect' },
    { emoji: '⚰️', label: 'Wrongful death' },
    { emoji: '📄', label: 'Has medical records' },
    { emoji: '⏰', label: 'Within statute window' },
  ],

  // ── SOCIAL SECURITY DISABILITY ──────────────────────────────────────────
  'social security disability': [
    { emoji: '🆕', label: 'First-time application' },
    { emoji: '❌', label: 'Claim was denied' },
    { emoji: '⚖️', label: 'Hearing scheduled' },
    { emoji: '🏥', label: 'Multiple conditions' },
    { emoji: '👨‍⚕️', label: 'Doctor supports claim' },
    { emoji: '💼', label: 'Can no longer work' },
    { emoji: '⏳', label: 'Waiting 6+ months already' },
    { emoji: '👴', label: 'Age 50+' },
  ],

  // ── WORKERS COMPENSATION ────────────────────────────────────────────────
  'workers compensation': [
    { emoji: '🏗️', label: 'Injured on the job' },
    { emoji: '❌', label: 'Claim denied' },
    { emoji: '🏥', label: 'Still receiving treatment' },
    { emoji: '💵', label: 'Benefits cut off' },
    { emoji: '📋', label: 'Employer disputing claim' },
    { emoji: '🔙', label: 'Back / repetitive injury' },
    { emoji: '⚖️', label: 'Settlement offered' },
    { emoji: '⚡', label: 'Injury was recent' },
  ],

  // ═══ HEALTHCARE & WELLNESS ═══════════════════════════════════════════════

  // ── HOME HEALTH AIDES ───────────────────────────────────────────────────
  'home health aides': [
    { emoji: '🚨', label: 'Urgent appointment needed' },
    { emoji: '🆕', label: 'New patient' },
    { emoji: '👴', label: 'Senior patient (65+)' },
    { emoji: '💉', label: 'Ongoing / chronic condition' },
    { emoji: '🏠', label: 'In-home care preferred' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '💰', label: 'No insurance / self-pay' },
    { emoji: '👶', label: 'Child / pediatric patient' },
  ],

  // ── SENIOR CARE & ASSISTED LIVING ───────────────────────────────────────
  'senior care & assisted living': [
    { emoji: '🏠', label: 'In-home care needed' },
    { emoji: '🏥', label: 'Assisted living inquiry' },
    { emoji: '💉', label: 'Medical condition involved' },
    { emoji: '🔄', label: '24/7 care required' },
    { emoji: '👶', label: 'Short-term / recovery care' },
    { emoji: '👨‍👩‍👧', label: 'Family looking on their behalf' },
    { emoji: '💰', label: 'Medicaid / Medicare coverage' },
    { emoji: '⚡', label: 'Need placement urgently' },
  ],

  // ── MENTAL HEALTH THERAPY ───────────────────────────────────────────────
  'mental health therapy': [
    { emoji: '🆕', label: 'First time seeking help' },
    { emoji: '💊', label: 'Medication management needed' },
    { emoji: '👶', label: 'Child / teen patient' },
    { emoji: '👨‍👩‍👧', label: 'Couples / family therapy' },
    { emoji: '🏠', label: 'Telehealth preferred' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '💰', label: 'Self-pay / sliding scale' },
    { emoji: '🚨', label: 'Crisis / urgent support' },
  ],

  // ── ADDICTION TREATMENT ─────────────────────────────────────────────────
  'addiction treatment': [
    { emoji: '🚨', label: 'Crisis — needs help today' },
    { emoji: '🍺', label: 'Alcohol' },
    { emoji: '💊', label: 'Opioids / pills' },
    { emoji: '🏥', label: 'Wants inpatient / detox' },
    { emoji: '🏠', label: 'Prefers outpatient' },
    { emoji: '🧠', label: 'Mental health also involved' },
    { emoji: '👨‍👩‍👧', label: 'Family calling for loved one' },
    { emoji: '🏥', label: 'Has insurance' },
  ],

  // ── CHIROPRACTIC ────────────────────────────────────────────────────────
  'chiropractic': [
    { emoji: '🔙', label: 'Lower back pain' },
    { emoji: '🚗', label: 'Auto accident injury' },
    { emoji: '🤕', label: 'Neck pain / headaches' },
    { emoji: '⚡', label: 'Pain is severe now' },
    { emoji: '🏃', label: 'Sports injury' },
    { emoji: '🔄', label: 'Wants ongoing care' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '🆕', label: 'First-time patient' },
  ],

  // ── COSMETIC SURGERY & MED SPA ──────────────────────────────────────────
  'cosmetic surgery & med spa': [
    { emoji: '💉', label: 'Botox / fillers' },
    { emoji: '✨', label: 'Laser treatment' },
    { emoji: '🏋️', label: 'Body contouring' },
    { emoji: '🩺', label: 'Surgery consultation wanted' },
    { emoji: '💒', label: 'Event coming up' },
    { emoji: '🆕', label: 'First-time patient' },
    { emoji: '💰', label: 'Financing needed' },
    { emoji: '🔄', label: 'Regular med spa client' },
  ],

  // ── DENTISTRY ───────────────────────────────────────────────────────────
  'dentistry': [
    { emoji: '🚨', label: 'Tooth pain — urgent' },
    { emoji: '🦷', label: 'Cleaning / checkup' },
    { emoji: '🕳️', label: 'Cavity / filling needed' },
    { emoji: '👑', label: 'Crown or implant' },
    { emoji: '😁', label: 'Cosmetic / whitening' },
    { emoji: '👶', label: 'Kids need care too' },
    { emoji: '🏥', label: 'Has dental insurance' },
    { emoji: '💰', label: 'Self-pay / needs payment plan' },
  ],

  // ── HEARING AIDS ────────────────────────────────────────────────────────
  'hearing aids': [
    { emoji: '👂', label: 'Never had hearing aids' },
    { emoji: '🔄', label: 'Upgrading old devices' },
    { emoji: '🩹', label: 'Repair needed' },
    { emoji: '🔊', label: 'Trouble hearing conversation' },
    { emoji: '👴', label: 'Senior patient' },
    { emoji: '🏥', label: 'Insurance may cover' },
    { emoji: '🏠', label: 'Home visit preferred' },
    { emoji: '💰', label: 'Price shopping' },
  ],

  // ── IV THERAPY & WELLNESS ───────────────────────────────────────────────
  'iv therapy & wellness': [
    { emoji: '💧', label: 'Hydration / recovery' },
    { emoji: '💪', label: 'Immunity boost' },
    { emoji: '🎉', label: 'Hangover relief' },
    { emoji: '🏠', label: 'Mobile / in-home visit' },
    { emoji: '👥', label: 'Group / party booking' },
    { emoji: '🔄', label: 'Recurring wellness plan' },
    { emoji: '🧬', label: 'NAD+ / specialty drip' },
    { emoji: '⚡', label: 'Same-day appointment' },
  ],

  // ── LASIK & VISION ──────────────────────────────────────────────────────
  'lasik & vision': [
    { emoji: '👓', label: 'Wants to ditch glasses' },
    { emoji: '🔎', label: 'LASIK candidacy check' },
    { emoji: '👁️', label: 'Cataract concern' },
    { emoji: '📱', label: 'Contact lens wearer' },
    { emoji: '💰', label: 'Financing needed' },
    { emoji: '⚡', label: 'Ready to schedule surgery' },
    { emoji: '🆕', label: 'Needs full eye exam first' },
  ],

  // ── MASSAGE THERAPY ─────────────────────────────────────────────────────
  'massage therapy': [
    { emoji: '🆕', label: 'First-time client' },
    { emoji: '🔄', label: 'Regular / monthly' },
    { emoji: '🏥', label: 'Therapeutic / injury related' },
    { emoji: '😌', label: 'Relaxation / stress relief' },
    { emoji: '🤰', label: 'Prenatal massage' },
    { emoji: '🏠', label: 'In-home / mobile preferred' },
    { emoji: '👥', label: 'Couples massage' },
    { emoji: '⚡', label: 'Need appointment soon' },
  ],

  // ── ORTHODONTICS ────────────────────────────────────────────────────────
  'orthodontics': [
    { emoji: '👦', label: 'Child / teen patient' },
    { emoji: '🧑', label: 'Adult patient' },
    { emoji: '😁', label: 'Invisalign preferred' },
    { emoji: '🦷', label: 'Traditional braces OK' },
    { emoji: '💰', label: 'Payment plan needed' },
    { emoji: '🏥', label: 'Has orthodontic coverage' },
    { emoji: '🔄', label: 'Second opinion wanted' },
    { emoji: '⚡', label: 'Wants to start ASAP' },
  ],

  // ── PHYSICAL THERAPY ────────────────────────────────────────────────────
  'physical therapy': [
    { emoji: '🏥', label: 'Post-surgery rehab' },
    { emoji: '🔙', label: 'Back / neck pain' },
    { emoji: '🏃', label: 'Sports injury' },
    { emoji: '🚗', label: 'Auto accident recovery' },
    { emoji: '👴', label: 'Balance / mobility (senior)' },
    { emoji: '📋', label: 'Has doctor referral' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '🏠', label: 'In-home visits preferred' },
  ],

  // ── WEIGHT LOSS CLINICS ─────────────────────────────────────────────────
  'weight loss clinics': [
    { emoji: '💉', label: 'Interested in GLP-1 meds' },
    { emoji: '🎯', label: '20–50 lbs to lose' },
    { emoji: '📊', label: '50+ lbs to lose' },
    { emoji: '🩺', label: 'Wants medical supervision' },
    { emoji: '🥗', label: 'Nutrition coaching wanted' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '💰', label: 'Self-pay OK' },
    { emoji: '⚡', label: 'Ready to start now' },
  ],

  // ═══ AUTO & TRANSPORTATION ═══════════════════════════════════════════════

  // ── AUTO MECHANIC ───────────────────────────────────────────────────────
  'auto mechanic': [
    { emoji: '🚫', label: "Vehicle won't start" },
    { emoji: '⚠️', label: 'Check engine light on' },
    { emoji: '💨', label: 'AC not working' },
    { emoji: '🔋', label: 'Battery / electrical issue' },
    { emoji: '🛞', label: 'Brakes / suspension' },
    { emoji: '🔄', label: 'Regular maintenance' },
    { emoji: '🚛', label: 'Truck, SUV, or van' },
    { emoji: '🏢', label: 'Fleet / multiple vehicles' },
  ],

  // ── AUTO BODY REPAIR ────────────────────────────────────────────────────
  'auto body repair': [
    { emoji: '💥', label: 'Collision damage' },
    { emoji: '🚪', label: 'Door ding / dent' },
    { emoji: '🎨', label: 'Paint / scratch repair' },
    { emoji: '🧊', label: 'Hail damage' },
    { emoji: '🛡️', label: 'Insurance claim filed' },
    { emoji: '💰', label: 'Paying out of pocket' },
    { emoji: '🚗', label: 'Vehicle still drivable' },
    { emoji: '⏰', label: 'Needs car back fast' },
  ],

  // ── AUTO GLASS REPAIR ───────────────────────────────────────────────────
  'auto glass repair': [
    { emoji: '🪟', label: 'Windshield cracked' },
    { emoji: '🕳️', label: 'Small chip — repairable' },
    { emoji: '🚪', label: 'Side window broken' },
    { emoji: '🏠', label: 'Mobile service wanted' },
    { emoji: '🛡️', label: 'Insurance may cover' },
    { emoji: '🚗', label: 'Newer car (camera recalibration)' },
    { emoji: '⚡', label: 'Same-day needed' },
    { emoji: '💰', label: 'Cash price shopping' },
  ],

  // ── CAR DEALERSHIPS ─────────────────────────────────────────────────────
  'car dealerships': [
    { emoji: '🆕', label: 'Wants new car' },
    { emoji: '🚗', label: 'Shopping used' },
    { emoji: '🔄', label: 'Has trade-in' },
    { emoji: '💰', label: 'Cash buyer' },
    { emoji: '🏦', label: 'Needs financing' },
    { emoji: '📊', label: 'Credit challenges' },
    { emoji: '🚙', label: 'Specific model in mind' },
    { emoji: '⚡', label: 'Buying this week' },
  ],

  // ── FLEET MANAGEMENT ────────────────────────────────────────────────────
  'fleet management': [
    { emoji: '🚛', label: '5+ vehicles' },
    { emoji: '🚗', label: 'Small fleet (under 5)' },
    { emoji: '📍', label: 'GPS tracking wanted' },
    { emoji: '🔧', label: 'Maintenance program needed' },
    { emoji: '⛽', label: 'Fuel costs concern' },
    { emoji: '📋', label: 'DOT compliance help' },
    { emoji: '🆕', label: 'Growing fleet' },
    { emoji: '🔄', label: 'Switching providers' },
  ],

  // ── LIMO & BLACK CAR ────────────────────────────────────────────────────
  'limo & black car': [
    { emoji: '💒', label: 'Wedding day' },
    { emoji: '✈️', label: 'Airport transfer' },
    { emoji: '🎉', label: 'Night out / party' },
    { emoji: '💼', label: 'Corporate account wanted' },
    { emoji: '🎓', label: 'Prom / school event' },
    { emoji: '👥', label: 'Large group (10+)' },
    { emoji: '📅', label: 'Date confirmed' },
    { emoji: '🍷', label: 'Wine tour / day trip' },
  ],

  // ── TOWING & ROADSIDE ASSISTANCE ────────────────────────────────────────
  'towing & roadside assistance': [
    { emoji: '🚨', label: 'Stranded right now' },
    { emoji: '🔋', label: 'Dead battery' },
    { emoji: '🛞', label: 'Flat tire' },
    { emoji: '🔑', label: 'Locked out of car' },
    { emoji: '⛽', label: 'Out of gas' },
    { emoji: '🚗', label: 'Accident tow needed' },
    { emoji: '🏠', label: 'Tow to home / shop' },
    { emoji: '🚛', label: 'Large vehicle / heavy duty' },
  ],

  // ═══ EDUCATION & TRAINING ════════════════════════════════════════════════

  // ── TUTORING (K-12) ─────────────────────────────────────────────────────
  'tutoring (k-12)': [
    { emoji: '👶', label: 'Elementary age (K–5)' },
    { emoji: '🧒', label: 'Middle school (6–8)' },
    { emoji: '🎓', label: 'High school (9–12)' },
    { emoji: '🆘', label: 'Struggling / needs help' },
    { emoji: '✨', label: 'Gifted / accelerated' },
    { emoji: '💻', label: 'Online sessions preferred' },
    { emoji: '📐', label: 'Math focus' },
    { emoji: '📖', label: 'Reading / writing focus' },
  ],

  // ── CDL TRAINING ────────────────────────────────────────────────────────
  'cdl training': [
    { emoji: '🚛', label: 'Wants Class A' },
    { emoji: '🚌', label: 'Class B / bus' },
    { emoji: '🆕', label: 'No experience yet' },
    { emoji: '📄', label: 'Has permit already' },
    { emoji: '💼', label: 'Job lined up after' },
    { emoji: '💰', label: 'Needs financing / sponsor' },
    { emoji: '⚡', label: 'Wants to start ASAP' },
    { emoji: '🔄', label: 'License refresher' },
  ],

  // ── CODING BOOTCAMPS ────────────────────────────────────────────────────
  'coding bootcamps': [
    { emoji: '🆕', label: 'Complete beginner' },
    { emoji: '💼', label: 'Career changer' },
    { emoji: '🖥️', label: 'Some coding experience' },
    { emoji: '🏠', label: 'Online / remote preferred' },
    { emoji: '🏫', label: 'In-person preferred' },
    { emoji: '💰', label: 'Financing / ISA needed' },
    { emoji: '⏰', label: 'Part-time (working now)' },
    { emoji: '🎯', label: 'Job placement priority' },
  ],

  // ── COLLEGE ADMISSIONS CONSULTING ───────────────────────────────────────
  'college admissions consulting': [
    { emoji: '🎓', label: 'Junior year student' },
    { emoji: '⏰', label: 'Senior — deadlines near' },
    { emoji: '🏆', label: 'Aiming Ivy / top-tier' },
    { emoji: '✍️', label: 'Essay help needed' },
    { emoji: '💰', label: 'Scholarship / aid guidance' },
    { emoji: '🏅', label: 'Athlete recruitment' },
    { emoji: '🌍', label: 'International student' },
    { emoji: '🔄', label: 'Transfer applicant' },
  ],

  // ── CORPORATE TRAINING ──────────────────────────────────────────────────
  'corporate training': [
    { emoji: '👥', label: 'Team of 10–50' },
    { emoji: '🏢', label: 'Company-wide program' },
    { emoji: '🎯', label: 'Leadership development' },
    { emoji: '💼', label: 'Sales training' },
    { emoji: '📋', label: 'Compliance requirement' },
    { emoji: '🏠', label: 'Virtual sessions OK' },
    { emoji: '📅', label: 'Specific date planned' },
    { emoji: '🔄', label: 'Ongoing program wanted' },
  ],

  // ── REAL ESTATE LICENSE COURSES ─────────────────────────────────────────
  'real estate license courses': [
    { emoji: '🆕', label: 'Getting first license' },
    { emoji: '📈', label: 'Upgrading to broker' },
    { emoji: '⏰', label: 'Exam scheduled soon' },
    { emoji: '🔄', label: 'License renewal / CE' },
    { emoji: '🏠', label: 'Online / self-paced wanted' },
    { emoji: '🏫', label: 'In-person classes preferred' },
    { emoji: '💼', label: 'Career change' },
    { emoji: '⚡', label: 'Fast-track wanted' },
  ],

  // ── SAT & ACT PREP ──────────────────────────────────────────────────────
  'sat & act prep': [
    { emoji: '📅', label: 'Test date scheduled' },
    { emoji: '🎯', label: 'Aiming 1400+ / 30+' },
    { emoji: '📈', label: 'Retake — improving score' },
    { emoji: '👤', label: '1-on-1 tutoring wanted' },
    { emoji: '👥', label: 'Group class OK' },
    { emoji: '🏠', label: 'Online sessions preferred' },
    { emoji: '🧮', label: 'Math is the weak spot' },
    { emoji: '📖', label: 'Reading / English weak spot' },
  ],

  // ── TRADE SCHOOL ENROLLMENT ─────────────────────────────────────────────
  'trade school enrollment': [
    { emoji: '🔧', label: 'HVAC / electrical / plumbing' },
    { emoji: '🚗', label: 'Automotive interest' },
    { emoji: '🏥', label: 'Healthcare / medical assistant' },
    { emoji: '💇', label: 'Cosmetology' },
    { emoji: '🆕', label: 'Recent grad' },
    { emoji: '💼', label: 'Career changer' },
    { emoji: '💰', label: 'Financial aid needed' },
    { emoji: '⚡', label: 'Next start date wanted' },
  ],

  // ═══ BUSINESS SERVICES ═══════════════════════════════════════════════════

  // ── BOOKKEEPING / SEO / WEB — see Financial + below ─────────────────────
  'seo & digital marketing': [
    { emoji: '🆕', label: 'New website / launch' },
    { emoji: '📈', label: 'Improve existing rankings' },
    { emoji: '📣', label: 'Paid ads management' },
    { emoji: '📱', label: 'Social media too' },
    { emoji: '🔄', label: 'Ongoing monthly retainer' },
    { emoji: '🎯', label: 'One-time project' },
    { emoji: '🌍', label: 'Multiple locations / markets' },
    { emoji: '📊', label: 'Needs analytics / reporting' },
  ],

  'web design & development': [
    { emoji: '🆕', label: 'Brand new website' },
    { emoji: '🔄', label: 'Redesign existing site' },
    { emoji: '🛒', label: 'E-commerce / online store' },
    { emoji: '📱', label: 'Mobile app too' },
    { emoji: '🔧', label: 'Fix / maintain existing site' },
    { emoji: '⚡', label: 'Fast turnaround needed' },
    { emoji: '💰', label: 'Budget-conscious' },
    { emoji: '📊', label: 'CRM / integrations needed' },
  ],

  // ── COMMERCIAL CLEANING ─────────────────────────────────────────────────
  'commercial cleaning': [
    { emoji: '🏢', label: 'Office space' },
    { emoji: '🏥', label: 'Medical facility' },
    { emoji: '🔄', label: 'Recurring service wanted' },
    { emoji: '1️⃣', label: 'One-time deep clean' },
    { emoji: '🏗️', label: 'Post-construction' },
    { emoji: '🌙', label: 'After-hours cleaning' },
    { emoji: '📦', label: 'Multiple locations' },
    { emoji: '📋', label: 'Needs insured / bonded crew' },
  ],

  // ── COMMERCIAL PRINTING ─────────────────────────────────────────────────
  'commercial printing': [
    { emoji: '📇', label: 'Business cards / stationery' },
    { emoji: '📄', label: 'Flyers / brochures' },
    { emoji: '🪧', label: 'Banners / signs' },
    { emoji: '📬', label: 'Direct mail campaign' },
    { emoji: '📦', label: 'Large quantity order' },
    { emoji: '🎨', label: 'Design help needed' },
    { emoji: '⚡', label: 'Rush job' },
    { emoji: '🔄', label: 'Recurring print needs' },
  ],

  // ── CYBERSECURITY ───────────────────────────────────────────────────────
  'cybersecurity': [
    { emoji: '🚨', label: 'Recent breach / incident' },
    { emoji: '📋', label: 'Compliance required (HIPAA / SOC 2)' },
    { emoji: '🛡️', label: 'Wants security assessment' },
    { emoji: '📧', label: 'Phishing concerns' },
    { emoji: '👥', label: 'Employee training needed' },
    { emoji: '🏥', label: 'Handles sensitive data' },
    { emoji: '🔄', label: 'Ongoing monitoring wanted' },
    { emoji: '🏢', label: '50+ employees' },
  ],

  // ── IT MANAGED SERVICES ─────────────────────────────────────────────────
  'it managed services': [
    { emoji: '🚨', label: 'Current IT issues / downtime' },
    { emoji: '🔄', label: 'Switching IT providers' },
    { emoji: '🆕', label: 'No IT support today' },
    { emoji: '☁️', label: 'Cloud migration wanted' },
    { emoji: '💾', label: 'Backup / recovery concerns' },
    { emoji: '👥', label: '10+ employees' },
    { emoji: '📦', label: 'Multiple locations' },
    { emoji: '📋', label: 'Compliance requirements' },
  ],

  // ── POS SYSTEMS ─────────────────────────────────────────────────────────
  'pos systems': [
    { emoji: '🍽️', label: 'Restaurant / bar' },
    { emoji: '🛍️', label: 'Retail store' },
    { emoji: '🆕', label: 'New business opening' },
    { emoji: '🔄', label: 'Replacing current system' },
    { emoji: '💳', label: 'High processing fees now' },
    { emoji: '🌐', label: 'Online ordering wanted' },
    { emoji: '📦', label: 'Inventory tracking needed' },
    { emoji: '⚡', label: 'Opening soon' },
  ],

  // ── STAFFING & HR ───────────────────────────────────────────────────────
  'staffing & hr': [
    { emoji: '⚡', label: 'Roles to fill now' },
    { emoji: '👥', label: 'Multiple openings' },
    { emoji: '🕐', label: 'Temporary / seasonal help' },
    { emoji: '🎯', label: 'Executive / specialized search' },
    { emoji: '📋', label: 'HR compliance help' },
    { emoji: '📄', label: 'Handbook / policies needed' },
    { emoji: '🔄', label: 'High turnover problem' },
    { emoji: '🆕', label: 'First hires' },
  ],

  // ── VOIP & PHONE SYSTEMS ────────────────────────────────────────────────
  'voip & phone systems': [
    { emoji: '🆕', label: 'New phone system needed' },
    { emoji: '🔄', label: 'Switching from landline' },
    { emoji: '💰', label: 'Cutting phone costs' },
    { emoji: '👥', label: '10+ lines needed' },
    { emoji: '🏠', label: 'Remote team support' },
    { emoji: '📞', label: 'Call center features' },
    { emoji: '📦', label: 'Multiple locations' },
    { emoji: '⚡', label: 'Setup needed fast' },
  ],

  // ═══ EVENTS & ENTERTAINMENT ══════════════════════════════════════════════

  // ── WEDDING PHOTOGRAPHY ─────────────────────────────────────────────────
  'wedding photography': [
    { emoji: '💒', label: 'Full wedding day' },
    { emoji: '💍', label: 'Engagement session too' },
    { emoji: '🎥', label: 'Video also wanted' },
    { emoji: '📅', label: 'Date confirmed' },
    { emoji: '🌍', label: 'Destination wedding' },
    { emoji: '👥', label: 'Large wedding (150+)' },
    { emoji: '📸', label: 'Second shooter wanted' },
    { emoji: '💰', label: 'Album / prints wanted' },
  ],

  // ── CATERING ────────────────────────────────────────────────────────────
  'catering': [
    { emoji: '💒', label: 'Wedding / formal event' },
    { emoji: '💼', label: 'Corporate / office event' },
    { emoji: '🎂', label: 'Birthday / celebration' },
    { emoji: '👥', label: 'Large event (100+)' },
    { emoji: '🤝', label: 'Small gathering (under 50)' },
    { emoji: '🥗', label: 'Dietary restrictions present' },
    { emoji: '🏞️', label: 'Outdoor / outdoor venue' },
    { emoji: '💰', label: 'Budget-conscious' },
  ],

  // ── CORPORATE EVENTS ────────────────────────────────────────────────────
  'corporate events': [
    { emoji: '🏢', label: 'Company party' },
    { emoji: '🎤', label: 'Conference / summit' },
    { emoji: '🤝', label: 'Team building' },
    { emoji: '🎄', label: 'Holiday party' },
    { emoji: '👥', label: '100+ attendees' },
    { emoji: '💰', label: 'Approved budget' },
    { emoji: '📅', label: 'Date locked in' },
    { emoji: '🏨', label: 'Venue still needed' },
  ],

  // ── DJS ─────────────────────────────────────────────────────────────────
  'djs': [
    { emoji: '💒', label: 'Wedding reception' },
    { emoji: '🎂', label: 'Birthday party' },
    { emoji: '🏢', label: 'Corporate event' },
    { emoji: '🎓', label: 'School dance / prom' },
    { emoji: '🎤', label: 'MC services too' },
    { emoji: '💡', label: 'Lighting package wanted' },
    { emoji: '📅', label: 'Date confirmed' },
    { emoji: '👥', label: '150+ guests' },
  ],

  // ── EVENT VENUES ────────────────────────────────────────────────────────
  'event venues': [
    { emoji: '💒', label: 'Wedding ceremony / reception' },
    { emoji: '🏢', label: 'Corporate function' },
    { emoji: '🎂', label: 'Private celebration' },
    { emoji: '👥', label: '100+ guests' },
    { emoji: '🌳', label: 'Outdoor space wanted' },
    { emoji: '🍽️', label: 'In-house catering preferred' },
    { emoji: '📅', label: 'Date flexible' },
    { emoji: '⚡', label: 'Date coming up fast' },
  ],

  // ── FLORISTS ────────────────────────────────────────────────────────────
  'florists': [
    { emoji: '💒', label: 'Wedding flowers' },
    { emoji: '🖤', label: 'Funeral / sympathy' },
    { emoji: '🎉', label: 'Event centerpieces' },
    { emoji: '🏢', label: 'Corporate / office standing order' },
    { emoji: '🚚', label: 'Delivery needed' },
    { emoji: '💰', label: 'Generous budget' },
    { emoji: '📅', label: 'Date confirmed' },
    { emoji: '🌸', label: 'Specific flowers in mind' },
  ],

  // ── PARTY RENTALS ───────────────────────────────────────────────────────
  'party rentals': [
    { emoji: '⛺', label: 'Tent needed' },
    { emoji: '🪑', label: 'Tables & chairs' },
    { emoji: '🎪', label: 'Bounce house / inflatables' },
    { emoji: '🎶', label: 'Stage / dance floor' },
    { emoji: '🍽️', label: 'Linens & tableware' },
    { emoji: '👥', label: '100+ guests' },
    { emoji: '🚚', label: 'Delivery & setup needed' },
    { emoji: '📅', label: 'Weekend event' },
  ],

  // ── VIDEOGRAPHY ─────────────────────────────────────────────────────────
  'videography': [
    { emoji: '💒', label: 'Wedding film' },
    { emoji: '🏢', label: 'Corporate / promo video' },
    { emoji: '🎉', label: 'Event coverage' },
    { emoji: '🚁', label: 'Drone footage wanted' },
    { emoji: '📱', label: 'Social media content' },
    { emoji: '📅', label: 'Date confirmed' },
    { emoji: '💰', label: 'Budget approved' },
    { emoji: '⚡', label: 'Quick turnaround needed' },
  ],

  // ── WEDDING PLANNING ────────────────────────────────────────────────────
  'wedding planning': [
    { emoji: '💍', label: 'Just engaged' },
    { emoji: '📅', label: 'Date & venue set' },
    { emoji: '🏨', label: 'Still needs venue' },
    { emoji: '🗓️', label: 'Wedding within 6 months' },
    { emoji: '🌍', label: 'Destination wedding' },
    { emoji: '👥', label: '150+ guests' },
    { emoji: '💰', label: 'Full-service budget' },
    { emoji: '🤝', label: 'Day-of coordination only' },
  ],

  // ═══ PETS ════════════════════════════════════════════════════════════════

  // ── DOG GROOMING ────────────────────────────────────────────────────────
  'dog grooming': [
    { emoji: '🐕', label: 'Dog' },
    { emoji: '🐈', label: 'Cat' },
    { emoji: '📦', label: 'Multiple pets' },
    { emoji: '🐶', label: 'Large / giant breed' },
    { emoji: '⚡', label: 'Long overdue — matted coat' },
    { emoji: '🏠', label: 'Mobile / in-home grooming' },
    { emoji: '🔄', label: 'Regular recurring appointment' },
    { emoji: '🆕', label: 'First-time groom' },
  ],

  // ── DOG TRAINING ────────────────────────────────────────────────────────
  'dog training': [
    { emoji: '🐶', label: 'Puppy (under 1 year)' },
    { emoji: '🐕', label: 'Adult dog' },
    { emoji: '🚨', label: 'Aggression / fear issues' },
    { emoji: '🏠', label: 'In-home training preferred' },
    { emoji: '👥', label: 'Group class OK' },
    { emoji: '🔄', label: 'Multiple sessions needed' },
    { emoji: '📋', label: 'Specific behavior to fix' },
    { emoji: '✅', label: 'Just basic obedience' },
  ],

  // ── PET INSURANCE ───────────────────────────────────────────────────────
  'pet insurance': [
    { emoji: '🐶', label: 'Puppy / kitten' },
    { emoji: '🐕', label: 'Adult dog' },
    { emoji: '🐈', label: 'Cat' },
    { emoji: '👴', label: 'Senior pet' },
    { emoji: '🏥', label: 'Recent vet scare' },
    { emoji: '📦', label: 'Multiple pets' },
    { emoji: '💰', label: 'Comparing quotes' },
    { emoji: '🩺', label: 'Wellness add-on wanted' },
  ],

  // ── PET SITTING & BOARDING ──────────────────────────────────────────────
  'pet sitting & boarding': [
    { emoji: '✈️', label: 'Vacation coming up' },
    { emoji: '🏠', label: 'In-home sitting preferred' },
    { emoji: '🏨', label: 'Boarding facility OK' },
    { emoji: '🐕', label: 'Dog(s)' },
    { emoji: '🐈', label: 'Cat(s)' },
    { emoji: '📦', label: 'Multiple pets' },
    { emoji: '💊', label: 'Pet needs medication' },
    { emoji: '🔄', label: 'Recurring / weekly need' },
  ],

  // ── VETERINARY CLINICS ──────────────────────────────────────────────────
  'veterinary clinics': [
    { emoji: '🚨', label: 'Emergency / urgent care' },
    { emoji: '🔄', label: 'Routine / annual checkup' },
    { emoji: '💉', label: 'Vaccinations needed' },
    { emoji: '🐕', label: 'Dog' },
    { emoji: '🐈', label: 'Cat' },
    { emoji: '👴', label: 'Senior pet (7+ years)' },
    { emoji: '🏠', label: 'Mobile vet preferred' },
    { emoji: '💰', label: 'Cost estimate needed first' },
  ],

  // ═══ BEAUTY & PERSONAL CARE ══════════════════════════════════════════════

  // ── HAIR SALONS ─────────────────────────────────────────────────────────
  'hair salons': [
    { emoji: '🆕', label: 'New client / first visit' },
    { emoji: '💒', label: 'Special occasion' },
    { emoji: '🔄', label: 'Regular / recurring' },
    { emoji: '✂️', label: 'Cut only' },
    { emoji: '🎨', label: 'Color / highlights' },
    { emoji: '👥', label: 'Group / bridal party' },
    { emoji: '🏠', label: 'Mobile / in-home service' },
    { emoji: '⚡', label: 'Need appointment soon' },
  ],

  // ── BARBERSHOPS ─────────────────────────────────────────────────────────
  'barbershops': [
    { emoji: '✂️', label: 'Standard cut' },
    { emoji: '🧔', label: 'Beard work too' },
    { emoji: '👦', label: "Kids' cuts needed" },
    { emoji: '🔄', label: 'Looking for regular barber' },
    { emoji: '💈', label: 'Hot towel shave' },
    { emoji: '⚡', label: 'Walk-in / today' },
    { emoji: '🏠', label: 'Mobile / house call' },
    { emoji: '💒', label: 'Event / photo-ready' },
  ],

  // ── EYELASH EXTENSIONS ──────────────────────────────────────────────────
  'eyelash extensions': [
    { emoji: '🆕', label: 'First full set' },
    { emoji: '🔄', label: 'Fill / refill needed' },
    { emoji: '💒', label: 'Wedding / event coming' },
    { emoji: '✨', label: 'Volume look wanted' },
    { emoji: '🌿', label: 'Natural look wanted' },
    { emoji: '🩹', label: 'Fix bad set elsewhere' },
    { emoji: '⚡', label: 'Appointment this week' },
  ],

  // ── PERMANENT MAKEUP & MICROBLADING ─────────────────────────────────────
  'permanent makeup & microblading': [
    { emoji: '🆕', label: 'First-time microblading' },
    { emoji: '🔄', label: 'Touch-up / refresh' },
    { emoji: '👁️', label: 'Eyeliner wanted' },
    { emoji: '💋', label: 'Lip blush wanted' },
    { emoji: '🩹', label: 'Correction of old work' },
    { emoji: '💒', label: 'Event coming up' },
    { emoji: '📸', label: 'Wants natural look' },
  ],

  // ── SPRAY TAN ───────────────────────────────────────────────────────────
  'spray tan': [
    { emoji: '💒', label: 'Wedding / event tan' },
    { emoji: '⚡', label: 'Needed within days' },
    { emoji: '🏠', label: 'Mobile service preferred' },
    { emoji: '🆕', label: 'First spray tan' },
    { emoji: '🔄', label: 'Regular appointments wanted' },
    { emoji: '🏋️', label: 'Competition tan' },
    { emoji: '👥', label: 'Group booking' },
  ],
};

/**
 * Returns the set of lead context chips for a given service category.
 * Falls back to DEFAULT_TAGS if the category is not specifically defined.
 */
export function getTagsForCategory(category: string): LeadTag[] {
  const key = category?.toLowerCase().trim() ?? '';
  return CATEGORY_TAGS[key] ?? DEFAULT_TAGS;
}
