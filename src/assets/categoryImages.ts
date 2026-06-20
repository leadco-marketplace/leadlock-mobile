// ─────────────────────────────────────────────────────────────────────────────
//  LeadCo — Bundled category & job-type photos (ALL 11 platform groups)
//
//  All images live in  leadlock-mobile/assets/categories/
//  and are committed to git so EAS cloud builds find them instantly.
//
//  To refresh / add photos: run  download-category-images.command
//  Then rebuild with:            live-feed-images.command
//
//  Metro bundler requires STATIC require() paths — no dynamic strings allowed.
//  Each require() is resolved at build time and packed into the JS bundle.
//
//  FALLBACK NOTES
//  ──────────────
//  • locksmith.jpg keeps returning HTTP 404 on Unsplash — uses handyman.jpg fallback.
//    Comment is kept so it's easy to swap back once a working URL is confirmed.
//  • New images are downloaded by download-category-images.command.
//    live-feed-images.command validates they exist before building.
// ─────────────────────────────────────────────────────────────────────────────

// ── Category-level photos ─────────────────────────────────────────────────────
// Keyed by category name, LOWERCASED. First match in JOB_TYPE_IMAGES wins, then this.
const CATEGORY_IMAGES: Record<string, any> = {

  // ── LOCAL HOME SERVICES ────────────────────────────────────────────────────
  // locksmith.jpg: Unsplash URL keeps returning 404 — use handyman.jpg as safe fallback
  'locksmith':            require('../../assets/categories/handyman.jpg'),
  'hvac':                 require('../../assets/categories/hvac.jpg'),
  'plumbing':             require('../../assets/categories/plumbing.jpg'),
  'electrical':           require('../../assets/categories/electrical.jpg'),
  'roofing':              require('../../assets/categories/roofing.jpg'),
  'chimney sweep':        require('../../assets/categories/chimney-sweep.jpg'),
  'garage door':          require('../../assets/categories/garage-door.jpg'),
  'landscaping':          require('../../assets/categories/landscaping.jpg'),
  'painting':             require('../../assets/categories/painting.jpg'),
  'flooring':             require('../../assets/categories/flooring.jpg'),
  'windows & doors':      require('../../assets/categories/jt-window-replace.jpg'),
  'cleaning':             require('../../assets/categories/cleaning.jpg'),
  'carpet cleaning':      require('../../assets/categories/carpet-cleaning.jpg'),
  'pest control':         require('../../assets/categories/pest-control.jpg'),
  'air duct cleaning':    require('../../assets/categories/air-duct-cleaning.jpg'),
  'pool service':         require('../../assets/categories/pool-service.jpg'),
  'appliance repair':     require('../../assets/categories/appliance-repair.jpg'),
  'handyman':             require('../../assets/categories/handyman.jpg'),
  'solar':                require('../../assets/categories/solar.jpg'),
  'moving':               require('../../assets/categories/moving.jpg'),
  'dog walker':           require('../../assets/categories/dog-walker.jpg'),
  'auto repair':          require('../../assets/categories/auto-repair.jpg'),
  'car dealer':           require('../../assets/categories/car-dealer.jpg'),

  // ── REAL ESTATE ───────────────────────────────────────────────────────────
  'real estate':                      require('../../assets/categories/real-estate.jpg'),
  'real estate agents':               require('../../assets/categories/real-estate.jpg'),
  'property management':              require('../../assets/categories/real-estate.jpg'),
  'home buyers (cash offers)':        require('../../assets/categories/cash-buyer.jpg'),
  'real estate investors':            require('../../assets/categories/re-investor.jpg'),
  'commercial real estate':           require('../../assets/categories/commercial-re.jpg'),
  'land buyers':                      require('../../assets/categories/land.jpg'),
  'short-term rental management':     require('../../assets/categories/short-term-rental.jpg'),
  'mortgage brokers':                 require('../../assets/categories/mortgage.jpg'),
  'home inspection':                  require('../../assets/categories/home-inspection.jpg'),

  // ── FINANCIAL SERVICES ────────────────────────────────────────────────────
  'financial services':               require('../../assets/categories/financial-planning.jpg'),
  'life insurance':                   require('../../assets/categories/life-insurance.jpg'),
  'auto insurance':                   require('../../assets/categories/auto-insurance.jpg'),
  'home insurance':                   require('../../assets/categories/home-insurance.jpg'),
  'health insurance':                 require('../../assets/categories/health-insurance.jpg'),
  'medicare / medicaid':              require('../../assets/categories/health-insurance.jpg'),
  'mortgage':                         require('../../assets/categories/mortgage.jpg'),
  'home equity loan / heloc':         require('../../assets/categories/mortgage.jpg'),
  'personal loan':                    require('../../assets/categories/personal-loan.jpg'),
  'business loan':                    require('../../assets/categories/business-loan.jpg'),
  'debt consolidation':               require('../../assets/categories/personal-loan.jpg'),
  'tax services':                     require('../../assets/categories/tax-services.jpg'),
  'financial planning':               require('../../assets/categories/financial-planning.jpg'),

  // ── LEGAL SERVICES ────────────────────────────────────────────────────────
  'legal services':                   require('../../assets/categories/legal.jpg'),
  'personal injury':                  require('../../assets/categories/personal-injury.jpg'),
  'car accident':                     require('../../assets/categories/personal-injury.jpg'),
  'slip & fall':                      require('../../assets/categories/personal-injury.jpg'),
  'medical malpractice':              require('../../assets/categories/legal.jpg'),
  'workers compensation':             require('../../assets/categories/personal-injury.jpg'),
  'criminal defense':                 require('../../assets/categories/criminal-defense.jpg'),
  'dui / dwi':                        require('../../assets/categories/criminal-defense.jpg'),
  'immigration':                      require('../../assets/categories/immigration.jpg'),
  'family law / divorce':             require('../../assets/categories/family-law.jpg'),
  'child custody':                    require('../../assets/categories/family-law.jpg'),
  'bankruptcy':                       require('../../assets/categories/bankruptcy.jpg'),
  'estate planning / probate':        require('../../assets/categories/estate-planning.jpg'),
  'business / contract dispute':      require('../../assets/categories/legal.jpg'),

  // ── HEALTHCARE & WELLNESS ─────────────────────────────────────────────────
  'healthcare & wellness':            require('../../assets/categories/home-health-aide.jpg'),
  'home health aide':                 require('../../assets/categories/home-health-aide.jpg'),
  'physical therapy':                 require('../../assets/categories/physical-therapy.jpg'),
  'occupational therapy':             require('../../assets/categories/physical-therapy.jpg'),
  'mental health / counseling':       require('../../assets/categories/mental-health.jpg'),
  'dental care':                      require('../../assets/categories/home-health-aide.jpg'),
  'weight loss program':              require('../../assets/categories/weight-loss.jpg'),
  'chiropractic':                     require('../../assets/categories/chiropractic.jpg'),
  'addiction treatment':              require('../../assets/categories/addiction-treatment.jpg'),
  'senior care':                      require('../../assets/categories/senior-care.jpg'),

  // ── AUTO & TRANSPORTATION ─────────────────────────────────────────────────
  'auto & transportation':            require('../../assets/categories/auto-mechanic.jpg'),
  'oil change / maintenance':         require('../../assets/categories/oil-change.jpg'),
  'tire service':                     require('../../assets/categories/auto-mechanic.jpg'),
  'roadside assistance':              require('../../assets/categories/towing.jpg'),
  'towing':                           require('../../assets/categories/towing.jpg'),
  'auto glass repair':                require('../../assets/categories/auto-glass.jpg'),
  'body work / collision':            require('../../assets/categories/auto-bodywork.jpg'),
  'detailing':                        require('../../assets/categories/auto-detailing.jpg'),
  'transmission':                     require('../../assets/categories/auto-mechanic.jpg'),

  // ── EDUCATION & TRAINING ──────────────────────────────────────────────────
  'education & training':             require('../../assets/categories/tutoring.jpg'),
  'k–12 tutoring':               require('../../assets/categories/tutoring.jpg'),
  'college prep / sat / act':         require('../../assets/categories/tutoring.jpg'),
  'trade / vocational school':        require('../../assets/categories/tutoring.jpg'),
  'online course':                    require('../../assets/categories/tutoring.jpg'),
  'language learning':                require('../../assets/categories/tutoring.jpg'),
  'professional certification':       require('../../assets/categories/tutoring.jpg'),
  'music / art lessons':              require('../../assets/categories/music-lessons.jpg'),
  'sports / fitness training':        require('../../assets/categories/fitness-training.jpg'),

  // ── BUSINESS SERVICES ─────────────────────────────────────────────────────
  'business services':                require('../../assets/categories/business-services.jpg'),
  'accounting / bookkeeping':         require('../../assets/categories/accounting.jpg'),
  'payroll':                          require('../../assets/categories/accounting.jpg'),
  'tax preparation':                  require('../../assets/categories/tax-services.jpg'),
  'marketing / seo':                  require('../../assets/categories/marketing.jpg'),
  'web design / development':         require('../../assets/categories/web-design.jpg'),
  'it support / managed services':    require('../../assets/categories/it-support.jpg'),
  'hr / staffing':                    require('../../assets/categories/business-services.jpg'),
  'legal / compliance':               require('../../assets/categories/legal.jpg'),
  'business insurance':               require('../../assets/categories/business-services.jpg'),
  'consulting':                       require('../../assets/categories/business-services.jpg'),

  // ── EVENTS & ENTERTAINMENT ────────────────────────────────────────────────
  'events & entertainment':           require('../../assets/categories/event-planning.jpg'),
  'dj / music':                       require('../../assets/categories/dj-music.jpg'),
  'photography':                      require('../../assets/categories/photography.jpg'),
  'videography':                      require('../../assets/categories/photography.jpg'),
  'catering':                         require('../../assets/categories/catering.jpg'),
  'venue':                            require('../../assets/categories/event-planning.jpg'),
  'florist':                          require('../../assets/categories/event-planning.jpg'),
  'event planning':                   require('../../assets/categories/event-planning.jpg'),
  'photo booth':                      require('../../assets/categories/photography.jpg'),
  'entertainment / performer':        require('../../assets/categories/dj-music.jpg'),

  // ── PETS ──────────────────────────────────────────────────────────────────
  'pets':                             require('../../assets/categories/dog-walker.jpg'),
  'grooming':                         require('../../assets/categories/pet-grooming.jpg'),
  'dog training':                     require('../../assets/categories/dog-walker.jpg'),
  'dog walking':                      require('../../assets/categories/dog-walker.jpg'),
  'pet sitting / boarding':           require('../../assets/categories/dog-walker.jpg'),
  'veterinary care':                  require('../../assets/categories/veterinary.jpg'),
  'mobile vet':                       require('../../assets/categories/veterinary.jpg'),
  'pet daycare':                      require('../../assets/categories/pet-grooming.jpg'),

  // ── BEAUTY & PERSONAL CARE ────────────────────────────────────────────────
  // lead-fields.ts uses en-dash (–) in "Hair – Cut & Style" etc.
  'beauty & personal care':             require('../../assets/categories/hair-salon.jpg'),
  'hair – cut & style':            require('../../assets/categories/hair-salon.jpg'),
  'hair – color':                  require('../../assets/categories/hair-salon.jpg'),
  'hair – extensions':             require('../../assets/categories/hair-salon.jpg'),
  'nails':                              require('../../assets/categories/nails.jpg'),
  'facial / skincare':                  require('../../assets/categories/facial.jpg'),
  'massage':                            require('../../assets/categories/massage.jpg'),
  'waxing':                             require('../../assets/categories/facial.jpg'),
  'lashes / brows':                     require('../../assets/categories/facial.jpg'),
  'makeup':                             require('../../assets/categories/hair-salon.jpg'),
  'spa package':                        require('../../assets/categories/massage.jpg'),
};

// ── Job-type-specific photos ──────────────────────────────────────────────────
// More specific photos keyed to the exact job type string (LOWERCASED).
// Takes priority over CATEGORY_IMAGES when a job type matches.
const JOB_TYPE_IMAGES: Record<string, any> = {

  // ── Locksmith ─────────────────────────────────────────────────────────────
  'car lockout / unlock':               require('../../assets/categories/jt-car-lockout.jpg'),
  'car lockout':                        require('../../assets/categories/jt-car-lockout.jpg'),
  'car key cut & programmed':           require('../../assets/categories/jt-car-lockout.jpg'),
  'car key replacement (lost all keys)': require('../../assets/categories/jt-car-lockout.jpg'),
  'home / residential lockout':         require('../../assets/categories/jt-lock-rekey.jpg'),
  'lock rekey':                         require('../../assets/categories/jt-lock-rekey.jpg'),
  'deadbolt installation':              require('../../assets/categories/jt-lock-install.jpg'),
  'lock change / replacement':          require('../../assets/categories/jt-lock-install.jpg'),
  'lock installation':                  require('../../assets/categories/jt-lock-install.jpg'),
  'business / commercial lock service': require('../../assets/categories/jt-commercial-lockout.jpg'),
  'commercial lockout':                 require('../../assets/categories/jt-commercial-lockout.jpg'),
  'safe opening / installation':        require('../../assets/categories/jt-key-duplication.jpg'),
  'panic bar / exit device installation': require('../../assets/categories/jt-commercial-lockout.jpg'),
  'master key system':                  require('../../assets/categories/jt-key-duplication.jpg'),
  'access control / keypad installation': require('../../assets/categories/jt-lock-install.jpg'),
  'key duplication':                    require('../../assets/categories/jt-key-duplication.jpg'),

  // ── Garage Door ───────────────────────────────────────────────────────────
  'broken spring replacement':          require('../../assets/categories/jt-broken-spring.jpg'),
  'cable repair / replacement':         require('../../assets/categories/garage-door.jpg'),
  'new garage door installation':       require('../../assets/categories/jt-new-garage-door.jpg'),
  'new garage door install':            require('../../assets/categories/jt-new-garage-door.jpg'),
  'opener replacement / new install':   require('../../assets/categories/jt-garage-opener.jpg'),
  'garage door opener repair':          require('../../assets/categories/jt-garage-opener.jpg'),
  'opener repair':                      require('../../assets/categories/jt-garage-opener.jpg'),
  "garage door won't open / stuck":     require('../../assets/categories/garage-door.jpg'),
  'panel / section replacement':        require('../../assets/categories/garage-door.jpg'),
  'track repair / realignment':         require('../../assets/categories/garage-door.jpg'),
  'keypad / remote programming':        require('../../assets/categories/jt-garage-opener.jpg'),
  'weatherstripping replacement':       require('../../assets/categories/garage-door.jpg'),

  // ── Plumbing ──────────────────────────────────────────────────────────────
  'drain clog / unclogging':            require('../../assets/categories/jt-drain-cleaning.jpg'),
  'drain cleaning':                     require('../../assets/categories/jt-drain-cleaning.jpg'),
  'pipe leak repair':                   require('../../assets/categories/jt-leak-repair.jpg'),
  'pipe replacement':                   require('../../assets/categories/plumbing.jpg'),
  'pipe repair':                        require('../../assets/categories/jt-leak-repair.jpg'),
  'leak repair':                        require('../../assets/categories/jt-leak-repair.jpg'),
  'water heater repair':                require('../../assets/categories/jt-water-heater.jpg'),
  'water heater replacement':           require('../../assets/categories/jt-water-heater.jpg'),
  'water heater':                       require('../../assets/categories/jt-water-heater.jpg'),
  'tankless water heater installation': require('../../assets/categories/jt-water-heater.jpg'),
  'toilet repair / replacement':        require('../../assets/categories/plumbing.jpg'),
  'faucet repair / replacement':        require('../../assets/categories/plumbing.jpg'),
  'garbage disposal install / repair':  require('../../assets/categories/plumbing.jpg'),
  'shower / bathtub repair':            require('../../assets/categories/plumbing.jpg'),
  'sewer line inspection':              require('../../assets/categories/jt-drain-cleaning.jpg'),
  'sewer line repair / replacement':    require('../../assets/categories/jt-drain-cleaning.jpg'),
  'water line repair / replacement':    require('../../assets/categories/jt-leak-repair.jpg'),
  'gas line repair / installation':     require('../../assets/categories/plumbing.jpg'),
  'sump pump install / repair':         require('../../assets/categories/plumbing.jpg'),
  'water softener / filtration install': require('../../assets/categories/plumbing.jpg'),

  // ── Painting ──────────────────────────────────────────────────────────────
  'interior painting':                   require('../../assets/categories/jt-interior-painting.jpg'),
  'exterior painting':                   require('../../assets/categories/jt-exterior-painting.jpg'),
  'house painting':                      require('../../assets/categories/painting.jpg'),
  'cabinet painting / refinishing':      require('../../assets/categories/jt-interior-painting.jpg'),
  'deck / fence staining or painting':   require('../../assets/categories/jt-exterior-painting.jpg'),
  'epoxy floor coating':                 require('../../assets/categories/painting.jpg'),
  'popcorn ceiling removal & painting':  require('../../assets/categories/jt-interior-painting.jpg'),
  'wallpaper installation':              require('../../assets/categories/jt-interior-painting.jpg'),
  'wallpaper removal':                   require('../../assets/categories/jt-interior-painting.jpg'),
  'commercial / business painting':      require('../../assets/categories/jt-exterior-painting.jpg'),

  // ── Landscaping ───────────────────────────────────────────────────────────
  'lawn mowing / maintenance':           require('../../assets/categories/landscaping.jpg'),
  'lawn mowing':                         require('../../assets/categories/landscaping.jpg'),
  'tree trimming / pruning':             require('../../assets/categories/jt-tree-removal.jpg'),
  'tree removal':                        require('../../assets/categories/jt-tree-removal.jpg'),
  'tree trimming':                       require('../../assets/categories/jt-tree-removal.jpg'),
  'stump grinding / removal':            require('../../assets/categories/jt-tree-removal.jpg'),
  'sod installation':                    require('../../assets/categories/landscaping.jpg'),
  'irrigation system installation':      require('../../assets/categories/jt-garden-maintenance.jpg'),
  'irrigation system repair':            require('../../assets/categories/jt-garden-maintenance.jpg'),
  'landscape design & installation':     require('../../assets/categories/landscaping.jpg'),
  'mulch / gravel installation':         require('../../assets/categories/landscaping.jpg'),
  'fence installation':                  require('../../assets/categories/landscaping.jpg'),
  'fence repair':                        require('../../assets/categories/landscaping.jpg'),
  'pressure washing':                    require('../../assets/categories/cleaning.jpg'),
  'leaf removal / yard cleanup':         require('../../assets/categories/jt-garden-maintenance.jpg'),
  'aeration & overseeding':              require('../../assets/categories/landscaping.jpg'),
  'garden maintenance':                  require('../../assets/categories/jt-garden-maintenance.jpg'),

  // ── Electrical ────────────────────────────────────────────────────────────
  'ev charger installation':             require('../../assets/categories/jt-ev-charger.jpg'),
  'outlet or switch repair / replacement': require('../../assets/categories/electrical.jpg'),
  'circuit breaker / panel upgrade':     require('../../assets/categories/electrical.jpg'),
  'new electrical panel installation':   require('../../assets/categories/electrical.jpg'),
  'electrical wiring / rewiring':        require('../../assets/categories/electrical.jpg'),
  'light fixture installation':          require('../../assets/categories/electrical.jpg'),
  'ceiling fan installation':            require('../../assets/categories/electrical.jpg'),
  'generator install / hookup':          require('../../assets/categories/electrical.jpg'),
  'gfci / safety upgrade':               require('../../assets/categories/electrical.jpg'),
  'smoke & co detector installation':    require('../../assets/categories/electrical.jpg'),
  'home surge protection':               require('../../assets/categories/electrical.jpg'),
  'outdoor / landscape lighting':        require('../../assets/categories/jt-ev-charger.jpg'),
  'electrical inspection':               require('../../assets/categories/electrical.jpg'),

  // ── Roofing ───────────────────────────────────────────────────────────────
  'storm damage repair':                 require('../../assets/categories/jt-storm-roof.jpg'),
  'roof leak repair':                    require('../../assets/categories/roofing.jpg'),
  'full roof replacement':               require('../../assets/categories/roofing.jpg'),
  'roof inspection':                     require('../../assets/categories/roofing.jpg'),
  'shingle repair / replacement':        require('../../assets/categories/roofing.jpg'),
  'flat roof repair':                    require('../../assets/categories/roofing.jpg'),
  'roof ventilation / attic fan':        require('../../assets/categories/roofing.jpg'),
  'flashing repair':                     require('../../assets/categories/roofing.jpg'),
  'skylight installation / repair':      require('../../assets/categories/roofing.jpg'),
  'gutter cleaning':                     require('../../assets/categories/jt-garden-maintenance.jpg'),
  'gutter repair / replacement':         require('../../assets/categories/roofing.jpg'),

  // ── Solar ─────────────────────────────────────────────────────────────────
  'solar panel install':                 require('../../assets/categories/solar.jpg'),
  'solar panel repair':                  require('../../assets/categories/jt-solar-repair.jpg'),

  // ── Windows & Doors ───────────────────────────────────────────────────────
  'window replacement':                  require('../../assets/categories/jt-window-replace.jpg'),
  'window repair':                       require('../../assets/categories/jt-window-replace.jpg'),
  'exterior door installation':          require('../../assets/categories/jt-window-replace.jpg'),
  'interior door installation':          require('../../assets/categories/handyman.jpg'),
  'door repair':                         require('../../assets/categories/handyman.jpg'),
  'sliding glass door repair / replacement': require('../../assets/categories/jt-window-replace.jpg'),
  'screen repair / replacement':         require('../../assets/categories/jt-window-replace.jpg'),
  'storm door installation':             require('../../assets/categories/jt-window-replace.jpg'),
  'entry door replacement':              require('../../assets/categories/jt-window-replace.jpg'),

  // ── Flooring ──────────────────────────────────────────────────────────────
  'hardwood floor installation':         require('../../assets/categories/flooring.jpg'),
  'hardwood floor refinishing / sanding': require('../../assets/categories/flooring.jpg'),
  'laminate / lvp / vinyl plank installation': require('../../assets/categories/flooring.jpg'),
  'tile installation':                   require('../../assets/categories/flooring.jpg'),
  'carpet installation':                 require('../../assets/categories/carpet-cleaning.jpg'),
  'carpet repair / stretching':          require('../../assets/categories/carpet-cleaning.jpg'),
  'vinyl / sheet flooring installation': require('../../assets/categories/flooring.jpg'),
  'subfloor repair':                     require('../../assets/categories/handyman.jpg'),
  'grout cleaning / regrouting':         require('../../assets/categories/flooring.jpg'),

  // ── HVAC ──────────────────────────────────────────────────────────────────
  'ac not cooling / repair':             require('../../assets/categories/hvac.jpg'),
  'ac tune-up & maintenance':            require('../../assets/categories/hvac.jpg'),
  'ac unit replacement / new install':   require('../../assets/categories/hvac.jpg'),
  'heat not working / repair':           require('../../assets/categories/hvac.jpg'),
  'heating system tune-up':              require('../../assets/categories/hvac.jpg'),
  'heating system replacement':          require('../../assets/categories/hvac.jpg'),
  'new hvac system installation':        require('../../assets/categories/hvac.jpg'),
  'mini-split / ductless ac install':    require('../../assets/categories/hvac.jpg'),
  'thermostat replacement / smart thermostat': require('../../assets/categories/hvac.jpg'),
  'refrigerant / freon recharge':        require('../../assets/categories/hvac.jpg'),
  'air quality / filtration system':     require('../../assets/categories/air-duct-cleaning.jpg'),

  // ── Air Duct Cleaning ─────────────────────────────────────────────────────
  'full hvac duct cleaning':             require('../../assets/categories/air-duct-cleaning.jpg'),
  'dryer vent cleaning':                 require('../../assets/categories/air-duct-cleaning.jpg'),
  'hvac system sanitizing / deodorizing': require('../../assets/categories/air-duct-cleaning.jpg'),
  'mold inspection / treatment in ducts': require('../../assets/categories/air-duct-cleaning.jpg'),
  'air duct sealing':                    require('../../assets/categories/air-duct-cleaning.jpg'),

  // ── Pool Service ──────────────────────────────────────────────────────────
  'weekly pool maintenance':             require('../../assets/categories/pool-service.jpg'),
  'pool cleaning (one-time)':            require('../../assets/categories/pool-service.jpg'),
  'chemical balancing / water testing':  require('../../assets/categories/pool-service.jpg'),
  'pump repair':                         require('../../assets/categories/pool-service.jpg'),
  'pump replacement':                    require('../../assets/categories/pool-service.jpg'),
  'filter cleaning / replacement':       require('../../assets/categories/pool-service.jpg'),
  'pool heater repair / replacement':    require('../../assets/categories/pool-service.jpg'),
  'pool light repair / replacement':     require('../../assets/categories/pool-service.jpg'),
  'leak detection / repair':             require('../../assets/categories/jt-leak-repair.jpg'),
  'pool opening (seasonal)':             require('../../assets/categories/pool-service.jpg'),
  'pool closing (seasonal)':             require('../../assets/categories/pool-service.jpg'),
  'pool resurfacing / replastering':     require('../../assets/categories/pool-service.jpg'),
  'pool renovation / remodel':           require('../../assets/categories/pool-service.jpg'),

  // ── Appliance Repair ──────────────────────────────────────────────────────
  'refrigerator repair':                 require('../../assets/categories/appliance-repair.jpg'),
  'dishwasher repair':                   require('../../assets/categories/appliance-repair.jpg'),
  'washer / washing machine repair':     require('../../assets/categories/appliance-repair.jpg'),
  'dryer repair':                        require('../../assets/categories/appliance-repair.jpg'),
  'oven / range / stove repair':         require('../../assets/categories/appliance-repair.jpg'),
  'microwave repair':                    require('../../assets/categories/appliance-repair.jpg'),
  'freezer repair':                      require('../../assets/categories/appliance-repair.jpg'),
  'ice maker repair':                    require('../../assets/categories/appliance-repair.jpg'),

  // ── Handyman ──────────────────────────────────────────────────────────────
  'furniture assembly':                  require('../../assets/categories/handyman.jpg'),
  'tv mounting':                         require('../../assets/categories/handyman.jpg'),
  'shelf / shelving installation':       require('../../assets/categories/handyman.jpg'),
  'drywall repair / patching':           require('../../assets/categories/handyman.jpg'),
  'caulking / weatherproofing':          require('../../assets/categories/handyman.jpg'),
  'deck repair':                         require('../../assets/categories/handyman.jpg'),
  'general home maintenance':            require('../../assets/categories/handyman.jpg'),

  // ── Chimney Sweep ─────────────────────────────────────────────────────────
  'chimney cleaning / sweeping':         require('../../assets/categories/chimney-sweep.jpg'),
  'chimney inspection (level 1)':        require('../../assets/categories/chimney-sweep.jpg'),
  'chimney inspection with camera (level 2)': require('../../assets/categories/chimney-sweep.jpg'),
  'chimney cap installation / replacement': require('../../assets/categories/chimney-sweep.jpg'),
  'flue repair / relining':              require('../../assets/categories/chimney-sweep.jpg'),
  'firebox repair':                      require('../../assets/categories/chimney-sweep.jpg'),
  'damper repair / replacement':         require('../../assets/categories/chimney-sweep.jpg'),
  'animal / debris removal':             require('../../assets/categories/chimney-sweep.jpg'),
  'waterproofing / sealing':             require('../../assets/categories/chimney-sweep.jpg'),
  'chimney rebuild / tuckpointing':      require('../../assets/categories/chimney-sweep.jpg'),

  // ── Pest Control ──────────────────────────────────────────────────────────
  'general pest inspection':             require('../../assets/categories/pest-control.jpg'),
  'ant treatment':                       require('../../assets/categories/pest-control.jpg'),
  'cockroach treatment':                 require('../../assets/categories/pest-control.jpg'),
  'rodent / mouse / rat control':        require('../../assets/categories/pest-control.jpg'),
  'termite inspection':                  require('../../assets/categories/pest-control.jpg'),
  'termite treatment':                   require('../../assets/categories/pest-control.jpg'),
  'bed bug treatment':                   require('../../assets/categories/pest-control.jpg'),
  'mosquito & tick control':             require('../../assets/categories/pest-control.jpg'),
  'wasp / bee / hornet removal':         require('../../assets/categories/pest-control.jpg'),
  'wildlife removal (raccoons, squirrels, etc.)': require('../../assets/categories/pest-control.jpg'),
  'flea treatment':                      require('../../assets/categories/pest-control.jpg'),

  // ── Cleaning ──────────────────────────────────────────────────────────────
  'regular / recurring house cleaning':  require('../../assets/categories/cleaning.jpg'),
  'deep cleaning (one-time)':            require('../../assets/categories/cleaning.jpg'),
  'move-in cleaning':                    require('../../assets/categories/cleaning.jpg'),
  'move-out cleaning':                   require('../../assets/categories/cleaning.jpg'),
  'post-construction cleaning':          require('../../assets/categories/cleaning.jpg'),
  'window cleaning':                     require('../../assets/categories/jt-window-replace.jpg'),
  'laundry / organizing service':        require('../../assets/categories/cleaning.jpg'),

  // ── Carpet Cleaning ───────────────────────────────────────────────────────
  'full home carpet cleaning':           require('../../assets/categories/carpet-cleaning.jpg'),
  'single room carpet cleaning':         require('../../assets/categories/carpet-cleaning.jpg'),
  'upholstery / sofa cleaning':          require('../../assets/categories/carpet-cleaning.jpg'),
  'stain removal':                       require('../../assets/categories/carpet-cleaning.jpg'),
  'pet odor / urine treatment':          require('../../assets/categories/carpet-cleaning.jpg'),
  'tile & grout cleaning':               require('../../assets/categories/flooring.jpg'),
  'area rug cleaning':                   require('../../assets/categories/carpet-cleaning.jpg'),

  // ── Financial Services ────────────────────────────────────────────────────
  'life insurance':                      require('../../assets/categories/life-insurance.jpg'),
  'auto insurance':                      require('../../assets/categories/auto-insurance.jpg'),
  'home insurance':                      require('../../assets/categories/home-insurance.jpg'),
  'health insurance':                    require('../../assets/categories/health-insurance.jpg'),
  'medicare / medicaid':                 require('../../assets/categories/health-insurance.jpg'),
  'home equity loan / heloc':            require('../../assets/categories/mortgage.jpg'),
  'personal loan':                       require('../../assets/categories/personal-loan.jpg'),
  'business loan':                       require('../../assets/categories/business-loan.jpg'),
  'debt consolidation':                  require('../../assets/categories/personal-loan.jpg'),
  'tax services':                        require('../../assets/categories/tax-services.jpg'),
  'financial planning':                  require('../../assets/categories/financial-planning.jpg'),

  // ── Legal Services ────────────────────────────────────────────────────────
  'personal injury':                     require('../../assets/categories/personal-injury.jpg'),
  'car accident':                        require('../../assets/categories/personal-injury.jpg'),
  'slip & fall':                         require('../../assets/categories/personal-injury.jpg'),
  'medical malpractice':                 require('../../assets/categories/legal.jpg'),
  'workers compensation':                require('../../assets/categories/personal-injury.jpg'),
  'criminal defense':                    require('../../assets/categories/criminal-defense.jpg'),
  'dui / dwi':                           require('../../assets/categories/criminal-defense.jpg'),
  'immigration':                         require('../../assets/categories/immigration.jpg'),
  'family law / divorce':                require('../../assets/categories/family-law.jpg'),
  'child custody':                       require('../../assets/categories/family-law.jpg'),
  'bankruptcy':                          require('../../assets/categories/bankruptcy.jpg'),
  'estate planning / probate':           require('../../assets/categories/estate-planning.jpg'),
  'business / contract dispute':         require('../../assets/categories/legal.jpg'),

  // ── Healthcare & Wellness ─────────────────────────────────────────────────
  'home health aide':                    require('../../assets/categories/home-health-aide.jpg'),
  'physical therapy':                    require('../../assets/categories/physical-therapy.jpg'),
  'occupational therapy':                require('../../assets/categories/physical-therapy.jpg'),
  'mental health / counseling':          require('../../assets/categories/mental-health.jpg'),
  'dental care':                         require('../../assets/categories/home-health-aide.jpg'),
  'weight loss program':                 require('../../assets/categories/weight-loss.jpg'),
  'chiropractic':                        require('../../assets/categories/chiropractic.jpg'),
  'addiction treatment':                 require('../../assets/categories/addiction-treatment.jpg'),
  'senior care':                         require('../../assets/categories/senior-care.jpg'),

  // ── Auto & Transportation ─────────────────────────────────────────────────
  'auto repair':                         require('../../assets/categories/auto-mechanic.jpg'),
  'oil change / maintenance':            require('../../assets/categories/oil-change.jpg'),
  'tire service':                        require('../../assets/categories/auto-mechanic.jpg'),
  'roadside assistance':                 require('../../assets/categories/towing.jpg'),
  'towing':                              require('../../assets/categories/towing.jpg'),
  'auto glass repair':                   require('../../assets/categories/auto-glass.jpg'),
  'body work / collision':               require('../../assets/categories/auto-bodywork.jpg'),
  'detailing':                           require('../../assets/categories/auto-detailing.jpg'),
  'transmission':                        require('../../assets/categories/auto-mechanic.jpg'),

  // ── Education & Training ──────────────────────────────────────────────────
  'k–12 tutoring':                  require('../../assets/categories/tutoring.jpg'),
  'college prep / sat / act':            require('../../assets/categories/tutoring.jpg'),
  'trade / vocational school':           require('../../assets/categories/tutoring.jpg'),
  'online course':                       require('../../assets/categories/tutoring.jpg'),
  'language learning':                   require('../../assets/categories/tutoring.jpg'),
  'professional certification':          require('../../assets/categories/tutoring.jpg'),
  'music / art lessons':                 require('../../assets/categories/music-lessons.jpg'),
  'sports / fitness training':           require('../../assets/categories/fitness-training.jpg'),

  // ── Business Services ─────────────────────────────────────────────────────
  'accounting / bookkeeping':            require('../../assets/categories/accounting.jpg'),
  'payroll':                             require('../../assets/categories/accounting.jpg'),
  'tax preparation':                     require('../../assets/categories/tax-services.jpg'),
  'marketing / seo':                     require('../../assets/categories/marketing.jpg'),
  'web design / development':            require('../../assets/categories/web-design.jpg'),
  'it support / managed services':       require('../../assets/categories/it-support.jpg'),
  'hr / staffing':                       require('../../assets/categories/business-services.jpg'),
  'legal / compliance':                  require('../../assets/categories/legal.jpg'),
  'business insurance':                  require('../../assets/categories/business-services.jpg'),
  'consulting':                          require('../../assets/categories/business-services.jpg'),

  // ── Events & Entertainment ────────────────────────────────────────────────
  'dj / music':                          require('../../assets/categories/dj-music.jpg'),
  'photography':                         require('../../assets/categories/photography.jpg'),
  'videography':                         require('../../assets/categories/photography.jpg'),
  'catering':                            require('../../assets/categories/catering.jpg'),
  'venue':                               require('../../assets/categories/event-planning.jpg'),
  'florist':                             require('../../assets/categories/event-planning.jpg'),
  'event planning':                      require('../../assets/categories/event-planning.jpg'),
  'photo booth':                         require('../../assets/categories/photography.jpg'),
  'entertainment / performer':           require('../../assets/categories/dj-music.jpg'),

  // ── Pets ──────────────────────────────────────────────────────────────────
  'grooming':                            require('../../assets/categories/pet-grooming.jpg'),
  'dog training':                        require('../../assets/categories/dog-walker.jpg'),
  'dog walking':                         require('../../assets/categories/dog-walker.jpg'),
  'pet sitting / boarding':              require('../../assets/categories/dog-walker.jpg'),
  'veterinary care':                     require('../../assets/categories/veterinary.jpg'),
  'mobile vet':                          require('../../assets/categories/veterinary.jpg'),
  'pet daycare':                         require('../../assets/categories/pet-grooming.jpg'),

  // ── Beauty & Personal Care ────────────────────────────────────────────────
  'hair – cut & style':             require('../../assets/categories/hair-salon.jpg'),
  'hair – color':                   require('../../assets/categories/hair-salon.jpg'),
  'hair – extensions':              require('../../assets/categories/hair-salon.jpg'),
  'nails':                               require('../../assets/categories/nails.jpg'),
  'facial / skincare':                   require('../../assets/categories/facial.jpg'),
  'massage':                             require('../../assets/categories/massage.jpg'),
  'waxing':                              require('../../assets/categories/facial.jpg'),
  'lashes / brows':                      require('../../assets/categories/facial.jpg'),
  'makeup':                              require('../../assets/categories/hair-salon.jpg'),
  'spa package':                         require('../../assets/categories/massage.jpg'),
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
