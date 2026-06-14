import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, FontSize, Spacing, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead } from '@/lib/api';

// ── Typography ────────────────────────────────────────────────────────────────
// Uses built-in system condensed font — no package install needed.
// Upgrade to Barlow Condensed later: npm install @expo-google-fonts/barlow-condensed
const FONT_BLACK = Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy'    : 'sans-serif-condensed';
const FONT_BOLD  = Platform.OS === 'ios' ? 'AvenirNextCondensed-DemiBold' : 'sans-serif-condensed';

// ── Category gradient fallbacks (shown when photo is loading or unavailable) ──
const CATEGORY_THUMB: Record<string, { colors: readonly [string, string] }> = {
  'locksmith':        { colors: ['#1a2a44', '#354a6e'] as const },
  'real estate':      { colors: ['#5c3a0c', '#906018'] as const },
  'garage door':      { colors: ['#2a3e52', '#3c5868'] as const },
  'chimney sweep':    { colors: ['#4a1008', '#7a2012'] as const },
  'dog walker':       { colors: ['#1a5008', '#308018'] as const },
  'car dealer':       { colors: ['#080c14', '#141c2c'] as const },
  'plumbing':         { colors: ['#0e2a5c', '#1c4080'] as const },
  'electrical':       { colors: ['#5a3a00', '#8a5c00'] as const },
  'hvac':             { colors: ['#0a3060', '#144888'] as const },
  'roofing':          { colors: ['#1e1e20', '#2e2e38'] as const },
  'painting':         { colors: ['#3a1060', '#5a2090'] as const },
  'cleaning':         { colors: ['#1a4040', '#246060'] as const },
  'pest control':     { colors: ['#3c2a0a', '#5a3e10'] as const },
  'landscaping':      { colors: ['#163a0c', '#225c18'] as const },
  'moving':           { colors: ['#2a1c60', '#42308a'] as const },
  'appliance repair': { colors: ['#1c3050', '#2c4870'] as const },
  'handyman':         { colors: ['#3a2010', '#5c3818'] as const },
  'pool service':     { colors: ['#062040', '#0c3868'] as const },
  'tree service':     { colors: ['#1a3808', '#2c5a10'] as const },
  'solar':            { colors: ['#4a3800', '#7a6000'] as const },
};
const DEFAULT_THUMB = { colors: ['#1e2a3e', '#2a3a52'] as const };

function getCategoryThumb(category: string) {
  return CATEGORY_THUMB[category.toLowerCase().trim()] ?? DEFAULT_THUMB;
}

// ── Category & subcategory photo mapping ──────────────────────────────────────
// All photo IDs verified directly from Unsplash search results.
// Job type (subcategory) is checked first, then category.
// If a URL fails to load, the gradient fallback shows automatically.
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=164&h=400&fit=crop&q=80`;

const JOB_TYPE_PHOTOS: Record<string, string> = {
  // Locksmith subcategories
  'car lockout':                U('1707296916219-4f2d7529a4c5'), // man opening door of black SUV
  'car lockout / unlock':       U('1707296916330-ae32416d9260'), // person holding car remote next to van
  'home / residential lockout': U('1564767609213-c75ee685263a'), // person holds door lever
  'lock rekey':                 U('1592744254966-58c65cfd2e69'), // silver combination lock
  'lock installation':          U('1614797091730-e2a6121aaa60'), // brass padlock on wooden door
  'commercial lockout':         U('1588689653688-9b312cd6bc2b'), // padlock on blue door
  'key duplication':            U('1635237393049-55046279ebb8'), // bunch of keys on table
  // Garage door subcategories
  'broken spring replacement':  U('1617782674367-341cf5f527c9'), // gray roll-up door closed
  'cable repair / replacement': U('1696992812596-3c0d4d2d1299'), // grey garage door brick wall
  'new garage door install':    U('1605276374104-dee2a0ed3cd6'), // house with garage door
  'garage door opener repair':  U('1540476547779-348beb642680'), // man standing in front of open garage
  // Plumbing subcategories
  'drain cleaning':             U('1649959738550-ad6254b9bb7e'), // water faucet with hose
  'pipe repair':                U('1760571327612-8ab776dcd462'), // hand holding brass pipe fitting
  'leak repair':                U('1693907986952-3cd372e4c9d8'), // blue pipe
  'water heater':               U('1768321916212-17ae334a3d63'), // pipes in brick wall
  // Painting subcategories
  'house painting':             U('1652829069834-2c05031199c5'), // man with paint roller on wall
  'interior painting':          U('1562259949-e8e7689d7828'),   // blue paint brush
  'exterior painting':          U('1574359411659-15573a27fd0c'), // two men on ladder painting wall
  // Landscaping subcategories
  'lawn mowing':                U('1458245201577-fc8a130b8829'), // lawnmower on green grass
  'garden maintenance':         U('1689728318937-17d24bc0a65c'), // man mowing lawn
  // Solar subcategories
  'solar panel install':        U('1613665813446-82a78c468a1d'), // black and white solar panels on roof
  'solar panel repair':         U('1658298775754-5839ffd434cc'), // solar panels on roof
  // Tree service subcategories
  'tree trimming':              U('Oq6YnFdXfZ8'), // trees standing in dirt
  'tree removal':               U('Oq6YnFdXfZ8'),
  'maintenance / tune-up':      U('Oq6YnFdXfZ8'),
};

const CATEGORY_PHOTOS: Record<string, string> = {
  'locksmith':        U('1564767609342-620cb19b2357'), // keys on hand
  'garage door':      U('1696992812596-3c0d4d2d1299'), // grey garage door next to brick wall
  'dog walker':       U('1587300003388-59208cc962cb'), // dog on leash being walked
  'real estate':      U('1560518883-ce09059eeffa'),   // house keys / real estate
  'plumbing':         U('1760571327612-8ab776dcd462'), // hand holding brass pipe fitting
  'electrical':       U('1621905251918-48416bd8575a'), // man with hard hat and orange drill
  'hvac':             U('1732395805034-e0bf859665e5'), // man in blue uniform in front of building
  'roofing':          U('1635424824800-692767998d07'), // man in yellow shirt working on roof
  'painting':         U('1652829069834-2c05031199c5'), // man with paint roller
  'cleaning':         U('1740657254989-42fe9c3b8cce'), // person cleaning floor with yellow gloves
  'pest control':     U('1593999094742-4f5280054b23'), // person with pest control equipment on grass
  'landscaping':      U('1458245201577-fc8a130b8829'), // lawnmower on green grass
  'moving':           U('1698917414969-feade59e3343'), // man unloading furniture from moving truck
  'appliance repair': U('1717176876437-490aa75bf9b5'), // man standing next to a dryer
  'handyman':         U('1562259929-b4e1fd3aef09'),   // blue and black Makita power drill
  'pool service':     U('1558617320-e695f0d420de'),   // swimming pool close-up photography
  'tree service':     U('Oq6YnFdXfZ8'), // tree branches against sky
  'solar':            U('1613665813446-82a78c468a1d'), // black and white solar panels on roof
  'car dealer':       U('1643142314913-0cf633d9bbb5'), // red car parked in a showroom
  'chimney sweep':    U('1554332208-9dfebcc48334'),   // firewood burning in fireplace
};

function getPhotoUrl(category: string, jobType?: string): string | null {
  const jt  = jobType?.toLowerCase().trim()  ?? '';
  const cat = category?.toLowerCase().trim() ?? '';
  return JOB_TYPE_PHOTOS[jt] ?? CATEGORY_PHOTOS[cat] ?? null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface LeadCardProps {
  lead: Lead;
  onUnlock?: () => void;
  unlocking?: boolean;
  purchased?: boolean;
  /** When true, renders a glowing accent border to indicate the notification-tapped lead */
  highlighted?: boolean;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LeadCard({ lead, onUnlock, unlocking, purchased, highlighted }: LeadCardProps) {
  useTheme(); // re-render on theme change so inline Colors.* picks up new values

  const [photoError, setPhotoError] = useState(false);

  const price     = lead.buyer_price_cents ?? Math.round(lead.price_cents * 1.125);
  const catThumb  = getCategoryThumb(lead.service_category);
  const photoUrl  = getPhotoUrl(lead.service_category, lead.job_type);
  const isSold    = lead.status === 'sold';

  // ── Pulse animation for notification-highlighted card ─────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) { pulseAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlighted, pulseAnim]);

  // ── LIVE badge orange glow blink (0.8 s cycle) ────────────────────────────
  const liveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lead.status !== 'available') { liveAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(liveAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lead.status, liveAnim]);

  const liveScale        = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.0] });
  const liveOpacity      = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.0,  1.0] });
  const liveShadowOp     = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.0,  0.8] });
  const liveShadowRadius = liveAnim.interpolate({ inputRange: [0, 1], outputRange: [0,    20]  });

  const animBorderColor = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#ff9333', '#ff5500'],
  });
  const animShadowOpacity = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.25, 0.95],
  });
  const animShadowRadius = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [6, 36],
  });

  function handleUnlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock?.();
  }

  return (
    // Outer wrapper carries the animated glow — no overflow:hidden so shadow radiates freely.
    // backgroundColor must be set inline (not StyleSheet) so it updates on theme change.
    <Animated.View style={[
      styles.glowWrap,
      { backgroundColor: Colors.panel },
      highlighted && {
        shadowColor:   '#ff9333',
        shadowOpacity: animShadowOpacity,
        shadowRadius:  animShadowRadius,
        shadowOffset:  { width: 0, height: 0 },
        elevation:     10,
      },
    ]}>

      {/* Card shell — backgroundColor inline so theme changes take effect */}
      <Animated.View style={[
        styles.card,
        {
          backgroundColor: Colors.panel,
          borderColor: highlighted ? animBorderColor : Colors.borderOrange,
        },
        highlighted && { borderWidth: 2.5 },
        isSold && styles.cardSold,
      ]}>

        {/* ── Left: category photo thumbnail ───────────────────────────────── */}
        <View style={styles.thumbCol}>
          {/* Photo (falls back to gradient on error or missing URL) */}
          {photoUrl && !photoError ? (
            <Image
              source={{ uri: photoUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <LinearGradient
              colors={catThumb.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {/* Dark overlay — makes category label readable over any photo */}
          <View style={styles.thumbDim} />
          {/* Category label — pinned to the bottom of the column */}
          <Text style={styles.thumbName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>
            {lead.service_category.toUpperCase()}
          </Text>
        </View>

        {/* ── Right: all lead content ───────────────────────────────────────── */}
        <View style={styles.rightCol}>

          {/* "🔥 Your Lead" banner */}
          {highlighted && (
            <View style={styles.highlightBanner}>
              <View style={styles.highlightBannerRow}>
                <Text style={styles.highlightBannerEmoji}>🔥</Text>
                <Text style={styles.highlightBannerText}>Your Lead</Text>
              </View>
            </View>
          )}

          {/* Header: category name + badges */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.category, { color: Colors.foreground }]}>
                {lead.service_category.toUpperCase()}
              </Text>
              <Text style={[styles.jobType, { color: Colors.textSecondary }]}>{lead.job_type}</Text>
              <Text style={[styles.location, { color: Colors.muted }]}>
                {lead.nationwide ? '🌐 Nationwide' : `${lead.city}, ${lead.state}`}
              </Text>
              {!lead.nationwide && lead.distance_minutes != null && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    📍 {lead.distance_minutes < 60
                      ? `${lead.distance_minutes} min away`
                      : `${(lead.distance_minutes / 60).toFixed(1)} hr away`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {lead.status === 'available' ? (
                <Animated.View style={[
                  styles.badge,
                  styles.badgeLive,
                  {
                    opacity:       liveOpacity,
                    transform:     [{ scale: liveScale }],
                    shadowColor:   '#f97316',
                    shadowOpacity: liveShadowOp,
                    shadowRadius:  liveShadowRadius,
                    shadowOffset:  { width: 0, height: 0 },
                    elevation:     8,
                  },
                ]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.badgeTextLive}>LIVE</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.badge,
                  styles.badgeOther,
                  { backgroundColor: Colors.panel2, borderColor: Colors.border },
                ]}>
                  <Text style={[styles.badgeText, { color: Colors.muted }]}>
                    {lead.status.toUpperCase()}
                  </Text>
                </View>
              )}
              {lead.quality_score != null && (
                <View style={styles.qualityBadge}>
                  <Text style={[styles.qualityText, { color: Colors.accent }]}>
                    ★ {lead.quality_score}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Summary */}
          {lead.public_summary && (
            <View style={[styles.summaryBox, { backgroundColor: Colors.panel2 }]}>
              <Text style={[styles.summaryText, { color: Colors.textSecondary }]} numberOfLines={3}>
                {lead.public_summary}
              </Text>
            </View>
          )}

          {/* Footer: time + price + unlock */}
          <View style={styles.footer}>
            <View>
              <Text style={[styles.timeAgo, { color: Colors.muted }]}>
                {timeAgo(lead.published_at ?? lead.created_at)}
              </Text>
              <Text style={[styles.price, { color: Colors.foreground }]}>
                {formatPrice(price)}
              </Text>
              {lead.lead_code && (
                <Text style={[styles.leadCode, { color: Colors.muted }]}>#{lead.lead_code}</Text>
              )}
            </View>

            {!purchased && onUnlock && (
              <TouchableOpacity onPress={handleUnlock} disabled={unlocking} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#1d4ed8', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.unlockBtn, unlocking && { opacity: 0.6 }]}
                >
                  <Text style={styles.unlockText}>
                    {unlocking ? 'Unlocking…' : `Unlock ${formatPrice(price)}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {purchased && (
              <View style={styles.purchasedBadge}>
                <Text style={[styles.purchasedText, { color: Colors.accent }]}>✓ Unlocked</Text>
              </View>
            )}
          </View>

        </View>{/* end rightCol */}

        {/* ── SOLD stamp — absoluteFill covers both columns ─────────────────── */}
        {isSold && (
          <>
            <View style={[StyleSheet.absoluteFillObject, styles.soldDim]} pointerEvents="none" />
            <View style={[StyleSheet.absoluteFillObject, styles.soldContainer]} pointerEvents="none">
              <View style={styles.soldBanner}>
                <Text style={styles.soldBannerText}>SOLD</Text>
              </View>
            </View>
          </>
        )}

      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// IMPORTANT: Colors that need to follow theme changes are set as INLINE styles
// in the JSX above (e.g. { backgroundColor: Colors.panel }), NOT here in
// StyleSheet.create(). StyleSheet.create() runs once at module load time and
// captures the initial dark-theme values — it won't update when the theme changes.
// Only non-color layout/spacing/radius/font values live here.
const THUMB_WIDTH = 82;

const styles = StyleSheet.create({
  // ── Outer glow wrapper ────────────────────────────────────────────────────
  // backgroundColor is set inline so it follows theme changes.
  glowWrap: {
    borderRadius:  Radius.xl,
    marginBottom:  Spacing.sm + 4,
  },

  // ── Card shell ────────────────────────────────────────────────────────────
  // backgroundColor and borderColor are set inline so they follow theme changes.
  card: {
    borderRadius:  Radius.xl,
    borderWidth:   1,
    flexDirection: 'row',
    overflow:      'hidden',
    ...Shadow.card,
  },
  cardSold: {
    borderColor: 'rgba(185,28,28,0.45)',
  },

  // ── Left thumbnail column ─────────────────────────────────────────────────
  thumbCol: {
    width:            THUMB_WIDTH,
    alignItems:       'center',
    justifyContent:   'flex-end',   // category label pinned to bottom
    paddingVertical:   10,
    paddingHorizontal: 6,
    backgroundColor:  '#1a2a44',    // neutral dark shown while photo loads
    overflow:         'hidden',     // clips photo to column bounds
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    // Bottom-weighted gradient overlay: darker at bottom for text readability,
    // lighter at top so the photo shows clearly.
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  thumbName: {
    fontSize:      8,
    fontFamily:    FONT_BOLD,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.82)',
    letterSpacing: 1.2,
    textAlign:     'center',
    lineHeight:    10,
  },

  // ── Right content column ──────────────────────────────────────────────────
  rightCol: {
    flex:    1,
    padding: Spacing.md,
    gap:     Spacing.sm,
  },

  // "🔥 Your Lead" banner
  highlightBanner: {
    backgroundColor:  '#ff9333',
    marginTop:        -Spacing.md,
    marginHorizontal: -Spacing.md,
    marginBottom:     Spacing.sm - 2,
    paddingVertical:  10,
    alignItems:       'center',
    justifyContent:   'center',
  },
  highlightBannerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: 6,
  },
  highlightBannerEmoji: {
    fontSize:   20,
    lineHeight: 24,
  },
  highlightBannerText: {
    color:         '#ffffff',
    fontSize:      20,
    lineHeight:    24,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  headerLeft:  { flex: 1, gap: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },

  category: {
    fontSize:      19,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 0.5,
    lineHeight:    21,
  },
  jobType: {
    fontSize:      12,
    fontFamily:    FONT_BOLD,
    fontWeight:    '700',
    letterSpacing: 0.4,
  },
  location: {
    fontSize:  FontSize.xs,
    marginTop: 1,
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  badgeLive: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   5,
    backgroundColor:   'rgba(249,115,22,0.10)',
    borderColor:       'rgba(249,115,22,0.40)',
    borderRadius:      Radius.sm,
    borderWidth:       1,
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#f97316',
  },
  badgeTextLive: {
    fontSize:      14,
    fontWeight:    '700',
    letterSpacing: 0.5,
    color:         '#f97316',
  },
  // badgeOther bg/border set inline (theme-aware)
  badgeOther: {},
  badgeText: {
    fontSize:      FontSize.xs - 1,
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      Radius.sm,
    backgroundColor:   'rgba(129,140,248,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(129,140,248,0.28)',
  },
  qualityText: {
    fontSize:   FontSize.xs - 1,
    fontWeight: '600',
  },
  distanceBadge: {
    alignSelf:         'flex-start',
    marginTop:         3,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:      Radius.sm,
    backgroundColor:   'rgba(16,185,129,0.10)',
    borderWidth:       1,
    borderColor:       'rgba(16,185,129,0.30)',
  },
  distanceText: {
    fontSize:   FontSize.xs - 1,
    color:      '#34d399',
    fontWeight: '600',
  },

  // ── Summary box ───────────────────────────────────────────────────────────
  // backgroundColor set inline (theme-aware)
  summaryBox: {
    borderRadius: Radius.md,
    padding:      Spacing.sm + 2,
    borderWidth:  1,
    borderColor:  'rgba(59,130,246,0.18)',
  },
  summaryText: {
    fontSize:   FontSize.xs,
    lineHeight: 18,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  timeAgo: {
    fontSize:     FontSize.xs,
    marginBottom: 3,   // ← spacing between time and price
  },
  price: {
    fontSize:      22,
    fontFamily:    FONT_BLACK,
    fontWeight:    '900',
    letterSpacing: 0.3,
    lineHeight:    24,
  },
  leadCode: {
    fontSize:      FontSize.xs - 1,
    fontFamily:    'Courier',
    marginTop:     2,
    letterSpacing: 0.5,
  },
  unlockBtn: {
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      Radius.lg,
  },
  unlockText: {
    fontSize:   FontSize.sm,
    fontWeight: '700',
    color:      '#ffffff',
  },
  purchasedBadge: {
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:      Radius.lg,
    backgroundColor:   'rgba(129,140,248,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(129,140,248,0.30)',
  },
  purchasedText: {
    fontSize:   FontSize.sm,
    fontWeight: '600',
  },

  // ── SOLD stamp ────────────────────────────────────────────────────────────
  soldDim: {
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  soldContainer: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  soldBanner: {
    width:           260,
    paddingVertical: 5,
    backgroundColor: 'rgba(185,28,28,0.88)',
    alignItems:      'center',
    transform:       [{ rotate: '-18deg' }],
    borderTopWidth:    1.5,
    borderBottomWidth: 1.5,
    borderColor:     'rgba(255,130,130,0.35)',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.55,
    shadowRadius:    8,
    elevation:       8,
  },
  soldBannerText: {
    color:            '#ffffff',
    fontSize:         22,
    fontWeight:       '900',
    letterSpacing:    9,
    textShadowColor:  'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
});
