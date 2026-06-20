// ─────────────────────────────────────────────────────────────────────────────
//  LeadCo — Bundled category & job-type photos
//
//  All images live in  leadlock-mobile/assets/categories/
//  and are committed to git so EAS cloud builds find them instantly.
//
//  To refresh photos, run:  download-category-images.command
//  Then rebuild with:       live-feed-images.command
//
//  Metro bundler requires STATIC require() paths — no dynamic strings allowed.
//  Each require() is resolved at build time and packed into the JS bundle.
//  At runtime: zero network requests, images appear in the same frame the
//  card renders.
// ─────────────────────────────────────────────────────────────────────────────

// ── Category-level photos ─────────────────────────────────────────────────────
// One photo per service category. Used when no job-type-specific photo matches.
const CATEGORY_IMAGES: Record<string, any> = {
  // locksmith.jpg returned HTTP 404 — use handyman (closest available trade photo)
  'locksmith':          require('../../assets/categories/handyman.jpg'),
  'real estate':        require('../../assets/categories/real-estate.jpg'),
  'real estate agents': require('../../assets/categories/real-estate.jpg'),
  'garage door':        require('../../assets/categories/garage-door.jpg'),
  'chimney sweep':      require('../../assets/categories/chimney-sweep.jpg'),
  'dog walker':         require('../../assets/categories/dog-walker.jpg'),
  'plumbing':           require('../../assets/categories/plumbing.jpg'),
  'electrical':         require('../../assets/categories/electrical.jpg'),
  'hvac':               require('../../assets/categories/hvac.jpg'),
  'roofing':            require('../../assets/categories/roofing.jpg'),
  'painting':           require('../../assets/categories/painting.jpg'),
  'cleaning':           require('../../assets/categories/cleaning.jpg'),
  // cleaning.jpg is confirmed downloaded — reused for carpet cleaning (same visual family)
  'carpet cleaning':    require('../../assets/categories/cleaning.jpg'),
  'pest control':       require('../../assets/categories/pest-control.jpg'),
  'landscaping':        require('../../assets/categories/landscaping.jpg'),
  'moving':             require('../../assets/categories/moving.jpg'),
  'appliance repair':   require('../../assets/categories/appliance-repair.jpg'),
  'handyman':           require('../../assets/categories/handyman.jpg'),
  'pool service':       require('../../assets/categories/pool-service.jpg'),
  // handyman.jpg reused for flooring — closest confirmed image
  'flooring':           require('../../assets/categories/handyman.jpg'),
  // electrical.jpg reused for windows & doors — both are home improvement trades
  'windows & doors':    require('../../assets/categories/electrical.jpg'),
  // hvac.jpg reused for air duct cleaning — same trade family
  'air duct cleaning':  require('../../assets/categories/hvac.jpg'),
  'solar':              require('../../assets/categories/solar.jpg'),
  'car dealer':         require('../../assets/categories/car-dealer.jpg'),
  // car-dealer.jpg reused for auto repair — both are automotive
  'auto repair':        require('../../assets/categories/car-dealer.jpg'),
};

// ── Job-type-specific photos ──────────────────────────────────────────────────
// More specific photos keyed to the exact job type string.
// These take priority over the category photo when the job type matches.
const JOB_TYPE_IMAGES: Record<string, any> = {
  // Locksmith
  'car lockout':                require('../../assets/categories/jt-car-lockout.jpg'),
  'car lockout / unlock':       require('../../assets/categories/jt-car-lockout.jpg'),
  // jt-home-lockout.jpg returned HTTP 404 — use jt-lock-rekey (same locksmith trade)
  'home / residential lockout': require('../../assets/categories/jt-lock-rekey.jpg'),
  'lock rekey':                 require('../../assets/categories/jt-lock-rekey.jpg'),
  'lock installation':          require('../../assets/categories/jt-lock-install.jpg'),
  'commercial lockout':         require('../../assets/categories/jt-commercial-lockout.jpg'),
  'key duplication':            require('../../assets/categories/jt-key-duplication.jpg'),

  // Garage door
  'broken spring replacement':  require('../../assets/categories/jt-broken-spring.jpg'),
  'cable repair / replacement': require('../../assets/categories/garage-door.jpg'),
  'new garage door installation': require('../../assets/categories/jt-new-garage-door.jpg'),
  'new garage door install':    require('../../assets/categories/jt-new-garage-door.jpg'),
  'opener replacement / new install': require('../../assets/categories/jt-garage-opener.jpg'),
  'garage door opener repair':  require('../../assets/categories/jt-garage-opener.jpg'),
  'opener repair':              require('../../assets/categories/jt-garage-opener.jpg'),

  // Plumbing
  'drain cleaning':             require('../../assets/categories/jt-drain-cleaning.jpg'),
  'pipe repair':                require('../../assets/categories/plumbing.jpg'),
  'pipe leak repair':           require('../../assets/categories/plumbing.jpg'),
  'leak repair':                require('../../assets/categories/jt-leak-repair.jpg'),
  'water heater replacement':   require('../../assets/categories/jt-water-heater.jpg'),
  'water heater':               require('../../assets/categories/jt-water-heater.jpg'),

  // Painting
  'house painting':             require('../../assets/categories/painting.jpg'),
  'interior painting':          require('../../assets/categories/jt-interior-painting.jpg'),
  'exterior painting':          require('../../assets/categories/jt-exterior-painting.jpg'),

  // Landscaping
  'lawn mowing':                require('../../assets/categories/landscaping.jpg'),
  'garden maintenance':         require('../../assets/categories/jt-garden-maintenance.jpg'),
  'tree removal':               require('../../assets/categories/jt-tree-removal.jpg'),
  'tree trimming':              require('../../assets/categories/jt-tree-removal.jpg'),

  // Solar
  'solar panel install':        require('../../assets/categories/solar.jpg'),
  'solar panel repair':         require('../../assets/categories/jt-solar-repair.jpg'),

  // Electrical
  'ev charger installation':    require('../../assets/categories/jt-ev-charger.jpg'),

  // Flooring — jt-hardwood-floor.jpg returned HTTP 404; use handyman (closest available)
  'hardwood floor installation': require('../../assets/categories/handyman.jpg'),

  // Windows & Doors
  'window replacement':         require('../../assets/categories/jt-window-replace.jpg'),

  // Roofing
  'storm damage repair':        require('../../assets/categories/jt-storm-roof.jpg'),
};

/**
 * Returns a pre-bundled local image source for a given category + job type.
 * Job-type-specific image is preferred; falls back to category image.
 * Returns null if neither is found (LeadCard will show the color gradient).
 */
export function getLeadImage(category: string, jobType?: string): any | null {
  const jt  = jobType?.toLowerCase().trim()  ?? '';
  const cat = category?.toLowerCase().trim() ?? '';
  return JOB_TYPE_IMAGES[jt] ?? CATEGORY_IMAGES[cat] ?? null;
}
