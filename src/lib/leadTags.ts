// ─────────────────────────────────────────────────────────────────────────────
//  LeadCo — Category-specific lead context chips
//
//  Each service category has its own tailored set of context chips that
//  help buyers quickly understand the lead's key characteristics.
//
//  Chips replace the old free-text description field on lead submission.
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

  // ── SOLAR ───────────────────────────────────────────────────────────────
  'solar': [
    { emoji: '🏠', label: 'Residential home' },
    { emoji: '🏢', label: 'Commercial building' },
    { emoji: '🔋', label: 'Battery storage too' },
    { emoji: '💰', label: 'Interested in tax incentives' },
    { emoji: '🔄', label: 'Replacing old system' },
    { emoji: '📊', label: 'Want energy audit first' },
    { emoji: '⚡', label: 'Fast installation needed' },
    { emoji: '🌍', label: 'Off-grid interest' },
  ],

  // ── MOVING ──────────────────────────────────────────────────────────────
  'moving': [
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
  'mortgage': [
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair credit (600–699)' },
    { emoji: '🔄', label: 'Refinancing existing mortgage' },
    { emoji: '🆕', label: 'First-time homebuyer' },
    { emoji: '🏢', label: 'Investment / rental property' },
    { emoji: '💵', label: 'Large loan ($500k+)' },
    { emoji: '🏦', label: 'Self-employed / non-W2 income' },
    { emoji: '⚡', label: 'Need to close fast' },
  ],
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
  'personal loan': [
    { emoji: '💳', label: 'Debt consolidation' },
    { emoji: '🏠', label: 'Home improvement' },
    { emoji: '🏥', label: 'Medical bills' },
    { emoji: '💼', label: 'Business purposes' },
    { emoji: '💰', label: 'Good credit (700+)' },
    { emoji: '📊', label: 'Fair / poor credit' },
    { emoji: '⚡', label: 'Funds needed quickly' },
    { emoji: '💵', label: 'Large amount ($20k+)' },
  ],
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
  'business loan': [
    { emoji: '🆕', label: 'Startup / early stage' },
    { emoji: '🏢', label: 'Established business (2+ yrs)' },
    { emoji: '💰', label: 'Strong revenue / good credit' },
    { emoji: '📊', label: 'Fair / building credit' },
    { emoji: '⚡', label: 'Funds needed urgently' },
    { emoji: '💵', label: 'Large amount ($100k+)' },
    { emoji: '🏗️', label: 'Equipment / asset purchase' },
    { emoji: '🔄', label: 'Refinancing existing debt' },
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

  // ── TAX SERVICES ────────────────────────────────────────────────────────
  'tax services': [
    { emoji: '💼', label: 'Self-employed / freelancer' },
    { emoji: '🏢', label: 'Business taxes' },
    { emoji: '🏠', label: 'Rental property taxes' },
    { emoji: '🔄', label: 'Prior year(s) unfiled' },
    { emoji: '📋', label: 'IRS issue / audit' },
    { emoji: '💵', label: 'Multiple income sources' },
    { emoji: '⚡', label: 'Need filing fast' },
    { emoji: '🌍', label: 'International income' },
  ],
  'tax preparation': [
    { emoji: '💼', label: 'Self-employed / freelancer' },
    { emoji: '🏢', label: 'Business taxes' },
    { emoji: '🏠', label: 'Rental property taxes' },
    { emoji: '🔄', label: 'Prior year(s) unfiled' },
    { emoji: '📋', label: 'IRS issue / audit' },
    { emoji: '💵', label: 'Multiple income sources' },
    { emoji: '⚡', label: 'Need filing fast' },
    { emoji: '🌍', label: 'International income' },
  ],

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

  // ── FAMILY LAW ──────────────────────────────────────────────────────────
  'family law / divorce': [
    { emoji: '📋', label: 'Uncontested / both agree' },
    { emoji: '⚡', label: 'Contested / complex case' },
    { emoji: '👶', label: 'Children involved' },
    { emoji: '🏠', label: 'Real estate / property to split' },
    { emoji: '💼', label: 'Business assets involved' },
    { emoji: '🔄', label: 'Modifying existing order' },
    { emoji: '🚨', label: 'Domestic violence concern' },
    { emoji: '⏰', label: 'Need to file quickly' },
  ],

  // ── IMMIGRATION ─────────────────────────────────────────────────────────
  'immigration': [
    { emoji: '📋', label: 'Green card application' },
    { emoji: '💼', label: 'Work visa / H-1B' },
    { emoji: '👨‍👩‍👧', label: 'Family petition' },
    { emoji: '🏡', label: 'Citizenship / naturalization' },
    { emoji: '⚡', label: 'Removal / deportation defense' },
    { emoji: '🛡️', label: 'Asylum case' },
    { emoji: '🔄', label: 'Status adjustment' },
    { emoji: '⏰', label: 'Urgent timeline' },
  ],

  // ── HEALTHCARE & WELLNESS ───────────────────────────────────────────────
  'home health aide': [
    { emoji: '🚨', label: 'Urgent appointment needed' },
    { emoji: '🆕', label: 'New patient' },
    { emoji: '👴', label: 'Senior patient (65+)' },
    { emoji: '💉', label: 'Ongoing / chronic condition' },
    { emoji: '🏠', label: 'In-home care preferred' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '💰', label: 'No insurance / self-pay' },
    { emoji: '👶', label: 'Child / pediatric patient' },
  ],
  'senior care': [
    { emoji: '🏠', label: 'In-home care needed' },
    { emoji: '🏥', label: 'Assisted living inquiry' },
    { emoji: '💉', label: 'Medical condition involved' },
    { emoji: '🔄', label: '24/7 care required' },
    { emoji: '👶', label: 'Short-term / recovery care' },
    { emoji: '👨‍👩‍👧', label: 'Family looking on their behalf' },
    { emoji: '💰', label: 'Medicaid / Medicare coverage' },
    { emoji: '⚡', label: 'Need placement urgently' },
  ],
  'mental health / counseling': [
    { emoji: '🆕', label: 'First time seeking help' },
    { emoji: '💊', label: 'Medication management needed' },
    { emoji: '👶', label: 'Child / teen patient' },
    { emoji: '👨‍👩‍👧', label: 'Couples / family therapy' },
    { emoji: '🏠', label: 'Telehealth preferred' },
    { emoji: '🏥', label: 'Has insurance' },
    { emoji: '💰', label: 'Self-pay / sliding scale' },
    { emoji: '🚨', label: 'Crisis / urgent support' },
  ],

  // ── AUTO REPAIR ─────────────────────────────────────────────────────────
  'auto repair': [
    { emoji: '🚫', label: "Vehicle won't start" },
    { emoji: '⚠️', label: 'Check engine light on' },
    { emoji: '💨', label: 'AC not working' },
    { emoji: '🔋', label: 'Battery / electrical issue' },
    { emoji: '🛞', label: 'Brakes / suspension' },
    { emoji: '🔄', label: 'Regular maintenance' },
    { emoji: '🚛', label: 'Truck, SUV, or van' },
    { emoji: '🏢', label: 'Fleet / multiple vehicles' },
  ],

  // ── EDUCATION ───────────────────────────────────────────────────────────
  'k–12 tutoring': [
    { emoji: '👶', label: 'Elementary age (K–5)' },
    { emoji: '🧒', label: 'Middle school (6–8)' },
    { emoji: '🎓', label: 'High school (9–12)' },
    { emoji: '🆘', label: 'Struggling / needs help' },
    { emoji: '✨', label: 'Gifted / accelerated' },
    { emoji: '💻', label: 'Online sessions preferred' },
    { emoji: '📐', label: 'Math focus' },
    { emoji: '📖', label: 'Reading / writing focus' },
  ],
  'sports / fitness training': [
    { emoji: '🆕', label: 'Beginner / just starting' },
    { emoji: '🏆', label: 'Competitive / athlete level' },
    { emoji: '💪', label: 'Weight loss goal' },
    { emoji: '🏋️', label: 'Strength training focus' },
    { emoji: '🏃', label: 'Cardio / endurance focus' },
    { emoji: '🧘', label: 'Flexibility / rehab' },
    { emoji: '📅', label: 'Flexible schedule' },
    { emoji: '🏠', label: 'In-home or outdoor preferred' },
  ],

  // ── BUSINESS SERVICES ───────────────────────────────────────────────────
  'accounting / bookkeeping': [
    { emoji: '🆕', label: 'Startup / new business' },
    { emoji: '🏢', label: 'Established business' },
    { emoji: '🔄', label: 'Ongoing monthly service' },
    { emoji: '📋', label: 'Catch-up / backlog needed' },
    { emoji: '💼', label: 'Payroll included' },
    { emoji: '📊', label: 'Financial reporting needed' },
    { emoji: '⚡', label: 'Tax season urgent' },
    { emoji: '💰', label: 'Budget-conscious' },
  ],
  'marketing / seo': [
    { emoji: '🆕', label: 'New website / launch' },
    { emoji: '📈', label: 'Improve existing rankings' },
    { emoji: '📣', label: 'Paid ads management' },
    { emoji: '📱', label: 'Social media too' },
    { emoji: '🔄', label: 'Ongoing monthly retainer' },
    { emoji: '🎯', label: 'One-time project' },
    { emoji: '🌍', label: 'Multiple locations / markets' },
    { emoji: '📊', label: 'Needs analytics / reporting' },
  ],
  'web design / development': [
    { emoji: '🆕', label: 'Brand new website' },
    { emoji: '🔄', label: 'Redesign existing site' },
    { emoji: '🛒', label: 'E-commerce / online store' },
    { emoji: '📱', label: 'Mobile app too' },
    { emoji: '🔧', label: 'Fix / maintain existing site' },
    { emoji: '⚡', label: 'Fast turnaround needed' },
    { emoji: '💰', label: 'Budget-conscious' },
    { emoji: '📊', label: 'CRM / integrations needed' },
  ],

  // ── EVENTS & ENTERTAINMENT ──────────────────────────────────────────────
  'photography': [
    { emoji: '💒', label: 'Wedding / ceremony' },
    { emoji: '🎂', label: 'Birthday / celebration' },
    { emoji: '👔', label: 'Corporate / headshots' },
    { emoji: '🏠', label: 'Real estate photos' },
    { emoji: '👶', label: 'Newborn / family portrait' },
    { emoji: '🎓', label: 'Graduation' },
    { emoji: '📅', label: 'Date is flexible' },
    { emoji: '📦', label: 'Product / commercial shoot' },
  ],
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

  // ── PETS ────────────────────────────────────────────────────────────────
  'grooming': [
    { emoji: '🐕', label: 'Dog' },
    { emoji: '🐈', label: 'Cat' },
    { emoji: '📦', label: 'Multiple pets' },
    { emoji: '🐶', label: 'Large / giant breed' },
    { emoji: '⚡', label: 'Long overdue — matted coat' },
    { emoji: '🏠', label: 'Mobile / in-home grooming' },
    { emoji: '🔄', label: 'Regular recurring appointment' },
    { emoji: '🆕', label: 'First-time groom' },
  ],
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
  'veterinary care': [
    { emoji: '🚨', label: 'Emergency / urgent care' },
    { emoji: '🔄', label: 'Routine / annual checkup' },
    { emoji: '💉', label: 'Vaccinations needed' },
    { emoji: '🐕', label: 'Dog' },
    { emoji: '🐈', label: 'Cat' },
    { emoji: '👴', label: 'Senior pet (7+ years)' },
    { emoji: '🏠', label: 'Mobile vet preferred' },
    { emoji: '💰', label: 'Cost estimate needed first' },
  ],

  // ── BEAUTY & PERSONAL CARE ──────────────────────────────────────────────
  'hair – cut & style': [
    { emoji: '🆕', label: 'New client / first visit' },
    { emoji: '💒', label: 'Special occasion' },
    { emoji: '🔄', label: 'Regular / recurring' },
    { emoji: '✂️', label: 'Cut only' },
    { emoji: '💇', label: 'Style / blowout only' },
    { emoji: '👥', label: 'Group / bridal party' },
    { emoji: '🏠', label: 'Mobile / in-home service' },
    { emoji: '⚡', label: 'Need appointment soon' },
  ],
  'nails': [
    { emoji: '🆕', label: 'New client' },
    { emoji: '💒', label: 'Special occasion / event' },
    { emoji: '👥', label: 'Group booking' },
    { emoji: '💅', label: 'Gel / acrylic set' },
    { emoji: '🔄', label: 'Refill / maintenance' },
    { emoji: '🏠', label: 'Mobile nail service' },
    { emoji: '⚡', label: 'Need appointment soon' },
    { emoji: '🎨', label: 'Nail art / design' },
  ],
  'massage': [
    { emoji: '🆕', label: 'First-time client' },
    { emoji: '🔄', label: 'Regular / monthly' },
    { emoji: '🏥', label: 'Therapeutic / injury related' },
    { emoji: '😌', label: 'Relaxation / stress relief' },
    { emoji: '🤰', label: 'Prenatal massage' },
    { emoji: '🏠', label: 'In-home / mobile preferred' },
    { emoji: '👥', label: 'Couples massage' },
    { emoji: '⚡', label: 'Need appointment soon' },
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
