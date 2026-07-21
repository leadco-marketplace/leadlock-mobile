import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  areasApi, categoriesApi, preferencesApi, profileApi, placesApi,
  ServiceArea, ServiceCategory, Preference, PlacePrediction,
} from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { CreditPill } from '@/components/CreditPill';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_RADIUS = 25;

// US state code → name (for display in chips)
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',     AK: 'Alaska',      AZ: 'Arizona',     AR: 'Arkansas',
  CA: 'California',  CO: 'Colorado',    CT: 'Connecticut',  DE: 'Delaware',
  FL: 'Florida',     GA: 'Georgia',     HI: 'Hawaii',       ID: 'Idaho',
  IL: 'Illinois',    IN: 'Indiana',     IA: 'Iowa',         KS: 'Kansas',
  KY: 'Kentucky',    LA: 'Louisiana',   ME: 'Maine',        MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan',  MN: 'Minnesota',    MS: 'Mississippi',
  MO: 'Missouri',    MT: 'Montana',     NE: 'Nebraska',     NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',  NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',     OK: 'Oklahoma',
  OR: 'Oregon',      PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee',  TX: 'Texas',        UT: 'Utah',
  VT: 'Vermont',     VA: 'Virginia',    WA: 'Washington',   WV: 'West Virginia',
  WI: 'Wisconsin',   WY: 'Wyoming',
};

// ── Main screen ───────────────────────────────────────────────────────────
export function AlertsScreen() {
  useTheme(); // re-render when theme changes so inline Colors.* picks up new values
  const navigation = useNavigation<any>();
  const { refreshProfile } = useAuth();

  const [areas,       setAreas]       = useState<ServiceArea[]>([]);
  const [categories,  setCategories]  = useState<ServiceCategory[]>([]);
  const [prefs,       setPrefs]       = useState<Preference[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [baseAddress, setBaseAddress] = useState<string>('');

  // "New Alert" mini-form state (category picker only)
  const [showForm,    setShowForm]    = useState(false);
  const [selCategory, setSelCategory] = useState<string | null>(null);
  const [catSearch,   setCatSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedAreas, fetchedCats, fetchedPrefs, fetchedProfile] = await Promise.all([
        areasApi.getAll(),
        categoriesApi.getAll(),
        preferencesApi.get(),
        profileApi.get(),
      ]);
      setAreas(fetchedAreas);
      setCategories(fetchedCats);
      setPrefs(fetchedPrefs);
      setBaseAddress(fetchedProfile.base_address ?? '');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the tab comes into focus (+ refresh the credit balance chip)
  useFocusEffect(useCallback(() => { load(); refreshProfile(); }, [load]));

  function resetForm() {
    setSelCategory(null);
    setCatSearch('');
    setShowForm(false);
  }

  // Navigate to AreaPickerScreen to edit areas for an existing pref
  function openEditAreas(pref: Preference) {
    navigation.navigate('AreaPicker', {
      prefId:            pref.id,
      serviceCategory:   pref.service_category,
      initialAreaIds:    pref.area_ids     ?? [],
      initialStateCodes: pref.state_codes  ?? [],
      initialRadius:     pref.radius_miles ?? DEFAULT_RADIUS,
      notifyEmail:       pref.notify_email ?? true,
      notifyPush:        pref.notify_push  ?? true,
    });
    resetForm();
  }

  // Navigate to AreaPickerScreen to create a new pref (category already chosen)
  function openNewPrefAreas() {
    if (!selCategory) {
      Alert.alert('Choose a category', 'Pick a category first.');
      return;
    }
    // Check if pref for this category already exists
    const existing = prefs.find(p => p.service_category === selCategory);
    if (existing) {
      Alert.alert(
        'Alert exists',
        `You already have an alert for "${selCategory}". Tap "Edit Areas" on the existing card to update it.`,
      );
      return;
    }
    navigation.navigate('AreaPicker', {
      prefId:            null,
      serviceCategory:   selCategory,
      initialAreaIds:    [],
      initialStateCodes: [],
      initialRadius:     DEFAULT_RADIUS,
      notifyEmail:       true,
      notifyPush:        true,
    });
    resetForm();
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Alert', 'Delete this lead alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await preferencesApi.delete(id);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  function areaName(id: string) {
    const a = areas.find(x => x.id === id);
    // a.name already includes the state (e.g. "Miami, Florida") — don't append
    // a.state again or it renders as "Miami, Florida, Florida".
    return a ? a.name : id;
  }

  // Filtered + grouped categories for the picker
  const filteredCats = useMemo(() => {
    if (!catSearch.trim()) return categories;
    const q = catSearch.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, catSearch]);

  const catGroups = useMemo(() => {
    const map: Record<string, ServiceCategory[]> = {};
    for (const cat of filteredCats) {
      const g = cat.group_name || 'Other';
      (map[g] ??= []).push(cat);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCats]);

  return (
    <ScreenShell title="Lead Alerts" subtitle="Get notified when matching leads go live" rightElement={<CreditPill />} scrollable>

      {/* ── Business location (distance anchor for alerts) ────────────── */}
      <BusinessLocationSection savedAddress={baseAddress} onChanged={setBaseAddress} />

      {/* ── Saved alerts ─────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>Your Alerts</Text>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
      ) : prefs.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: Colors.panel, borderColor: Colors.border }]}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: Colors.foreground }]}>No alerts yet</Text>
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
            Add an alert below and we'll notify you as soon as a matching lead is published.
          </Text>
        </View>
      ) : (
        prefs.map(pref => {
          const stateCodes = pref.state_codes ?? [];
          const areaIds    = pref.area_ids    ?? [];
          const hasAny     = stateCodes.length > 0 || areaIds.length > 0;

          return (
            <View key={pref.id} style={[styles.prefCard, { backgroundColor: Colors.panel, borderColor: Colors.border, shadowColor: Colors.glowColor }]}>
              {/* Header row: category badge + delete */}
              <View style={styles.prefHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{pref.service_category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(pref.id)}
                  disabled={deletingId === pref.id}
                  style={styles.deleteBtn}
                >
                  {deletingId === pref.id
                    ? <ActivityIndicator size="small" color={Colors.danger} />
                    : <Text style={styles.deleteBtnText}>✕</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Area chips */}
              {!hasAny ? (
                <Text style={[styles.prefAreaText, { color: Colors.textSecondary }]}>📍 All areas (nationwide)</Text>
              ) : (
                <View style={styles.prefChips}>
                  {/* State chips (blue) */}
                  {stateCodes.map(code => (
                    <View key={code} style={styles.stateChip}>
                      <Text style={[styles.stateChipText, { color: Colors.accent }]}>
                        🗺  {STATE_NAMES[code] ?? code}
                      </Text>
                    </View>
                  ))}
                  {/* City chips (green) */}
                  {areaIds.map(id => (
                    <View key={id} style={styles.cityChip}>
                      <Text style={[styles.cityChipText, { color: Colors.good }]}>📍  {areaName(id)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Radius badge — only shown when city areas exist */}
              {areaIds.length > 0 && (
                <View style={styles.radiusBadgeRow}>
                  <View style={styles.radiusBadge}>
                    <Text style={[styles.radiusBadgeText, { color: Colors.accent }]}>
                      📡 {pref.radius_miles ?? DEFAULT_RADIUS} mi radius
                    </Text>
                  </View>
                </View>
              )}

              {/* Notification badges */}
              <View style={styles.notifRow}>
                {pref.notify_email
                  ? <View style={styles.notifOn}><Text style={styles.notifOnText}>📧 Email on</Text></View>
                  : <View style={[styles.notifOff, { backgroundColor: Colors.panel2 }]}><Text style={[styles.notifOffText, { color: Colors.muted }]}>📧 Email off</Text></View>
                }
                {pref.notify_push
                  ? <View style={styles.notifOn}><Text style={styles.notifOnText}>📱 Push on</Text></View>
                  : <View style={[styles.notifOff, { backgroundColor: Colors.panel2 }]}><Text style={[styles.notifOffText, { color: Colors.muted }]}>📱 Push off</Text></View>
                }
              </View>

              {/* Edit button → navigates to AreaPickerScreen */}
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: Colors.accent }]}
                onPress={() => openEditAreas(pref)}
                activeOpacity={0.75}
              >
                <Text style={[styles.editBtnText, { color: Colors.accent }]}>✏️  Edit Areas & Notifications</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* ── Add new alert ─────────────────────────────────────────────── */}
      {!showForm ? (
        <TouchableOpacity style={[styles.addBtn, { borderColor: Colors.borderOrange }]} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Text style={[styles.addBtnText, { color: Colors.orange }]}>＋ Add New Alert</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.formCard, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
          <Text style={[styles.formTitle, { color: Colors.foreground }]}>New Alert</Text>

          {/* Category search */}
          <Text style={[styles.fieldLabel, { color: Colors.text }]}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.searchRow, { marginBottom: Spacing.xs, backgroundColor: Colors.panel2, borderColor: Colors.border2 }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: Colors.foreground }]}
              placeholder="Search categories…"
              placeholderTextColor={Colors.muted}
              value={catSearch}
              onChangeText={setCatSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {catGroups.length === 0 ? (
            <Text style={[styles.noText, { color: Colors.muted }]}>No categories match "{catSearch}"</Text>
          ) : (
            catGroups.map(([group, cats]) => (
              <View key={group} style={{ marginBottom: Spacing.xs }}>
                <Text style={[styles.groupLabel, { color: Colors.accent }]}>{group}</Text>
                <View style={styles.chipRow}>
                  {cats.map(cat => {
                    const sel = selCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, { backgroundColor: Colors.panel2, borderColor: Colors.border2 }, sel && styles.chipSelected]}
                        onPress={() => setSelCategory(prev => prev === cat.name ? null : cat.name)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, { color: Colors.textSecondary }, sel && styles.chipTextSelected]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          {/* Actions */}
          <View style={styles.formActions}>
            <Button variant="ghost"   label="Cancel"          onPress={resetForm} />
            <Button variant="primary" label="Next: Choose Areas →" onPress={openNewPrefAreas} />
          </View>
        </View>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScreenShell>
  );
}

// ── Business location (distance anchor for lead alerts) ──────────────────
// Alert distances used to be measured from the buyer's closest service-area
// center — an arbitrary city pin that could sit miles from their real shop.
// Saving a business location makes it the anchor instead ("≈3 mi away" =
// ≈3 mi from THEIR door). Optional; never shown to customers. Saves through
// the same PATCH /api/profile the web Alert Settings page uses.
// NOTE: all colors are applied inline from Colors.* (theme mutates Colors —
// never bake colors into module-level StyleSheet objects).

function BusinessLocationSection({
  savedAddress, onChanged,
}: {
  savedAddress: string;
  onChanged:    (address: string) => void;
}) {
  useTheme(); // re-render when theme changes so inline Colors.* picks up new values
  const [editing,     setEditing]     = useState(false);
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChangeText(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Address search needs more chars to get useful results from Nominatim
    if (text.length < 5) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await placesApi.autocomplete(text, 'address');
        setSuggestions(results);
      } catch { /* ignore network errors */ }
      finally { setSearching(false); }
    }, 400);
  }

  async function pickSuggestion(item: PlacePrediction) {
    setSuggestions([]);
    setSaving(true);
    try {
      await profileApi.update({
        base_address: item.description,
        base_lat:     item.lat,
        base_lng:     item.lng,
      });
      onChanged(item.description);
      setEditing(false);
      setQuery('');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save your business location.');
    } finally {
      setSaving(false);
    }
  }

  async function removeLocation() {
    setSaving(true);
    try {
      await profileApi.update({ base_address: null, base_lat: null, base_lng: null });
      onChanged('');
      setEditing(false);
      setQuery('');
      setSuggestions([]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not remove your business location.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[bl.card, { backgroundColor: Colors.panel, borderColor: Colors.border, shadowColor: Colors.glowColor }]}>
      <Text style={[bl.title, { color: Colors.foreground }]}>📍 Business Location</Text>
      <Text style={[bl.hint, { color: Colors.textSecondary }]}>
        Used to show accurate distances in your lead alerts. Never shown to customers.
      </Text>

      {savedAddress && !editing ? (
        <>
          <View style={[bl.addressBox, { backgroundColor: Colors.panel2, borderColor: Colors.border2 }]}>
            <Text style={[bl.addressText, { color: Colors.foreground }]}>{savedAddress}</Text>
          </View>
          <View style={bl.actionsRow}>
            <TouchableOpacity
              style={[bl.actionBtn, { borderColor: Colors.accent }]}
              onPress={() => { setEditing(true); setQuery(''); setSuggestions([]); }}
              disabled={saving}
              activeOpacity={0.75}
            >
              <Text style={[bl.actionBtnText, { color: Colors.accent }]}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[bl.actionBtn, { borderColor: 'rgba(248,113,113,0.45)' }]}
              onPress={removeLocation}
              disabled={saving}
              activeOpacity={0.75}
            >
              {saving
                ? <ActivityIndicator size="small" color={Colors.danger} />
                : <Text style={[bl.actionBtnText, { color: Colors.danger }]}>Remove</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={[bl.inputRow, { backgroundColor: Colors.panel2, borderColor: Colors.border2 }]}>
            <TextInput
              style={[bl.input, { color: Colors.foreground }]}
              value={query}
              onChangeText={handleChangeText}
              placeholder="Type your shop or office address…"
              placeholderTextColor={Colors.muted}
              autoCorrect={false}
              autoCapitalize="words"
              editable={!saving}
            />
            {(searching || saving) && (
              <ActivityIndicator size="small" color={Colors.orange} style={{ marginRight: 8 }} />
            )}
          </View>
          {suggestions.length > 0 && (
            <View style={[bl.dropdown, { backgroundColor: Colors.panel2, borderColor: Colors.border2 }]}>
              {suggestions.map(item => (
                <TouchableOpacity
                  key={item.place_id}
                  style={bl.suggestion}
                  onPress={() => pickSuggestion(item)}
                  disabled={saving}
                >
                  <Text style={[bl.suggestionText, { color: Colors.text }]}>{item.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {savedAddress && (
            <TouchableOpacity
              onPress={() => { setEditing(false); setQuery(''); setSuggestions([]); }}
              style={bl.cancelLink}
            >
              <Text style={[bl.cancelLinkText, { color: Colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const bl = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth:  1,
    padding:      Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  title:      { fontSize: FontSize.md, fontWeight: '700', marginBottom: 4 },
  hint:       { fontSize: FontSize.xs, lineHeight: 16, marginBottom: Spacing.sm },
  addressBox: {
    borderRadius:      Radius.md,
    borderWidth:       1,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
  },
  addressText: { fontSize: FontSize.sm, fontWeight: '600' },
  actionsRow:  { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: {
    borderWidth:       1,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   6,
    alignItems:        'center',
    justifyContent:    'center',
  },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
  inputRow: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Radius.md,
    borderWidth:       1,
    paddingHorizontal: Spacing.md,
  },
  input:    { flex: 1, fontSize: FontSize.sm, paddingVertical: Spacing.sm + 2 },
  dropdown: {
    borderRadius: Radius.md,
    borderWidth:  1,
    marginTop:    4,
    overflow:     'hidden',
  },
  suggestion:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  suggestionText: { fontSize: FontSize.sm },
  cancelLink:     { alignSelf: 'flex-start', marginTop: Spacing.xs, paddingVertical: 4 },
  cancelLinkText: { fontSize: FontSize.xs, fontWeight: '600' },
});

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionLabel: {
    fontSize:      FontSize.sm,
    fontWeight:    '700',
    color:         Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  Spacing.sm,
  },

  emptyCard: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.xl,
    alignItems:      'center',
    marginBottom:    Spacing.lg,
  },
  emptyIcon:  { fontSize: 36, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.xs },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Pref cards
  prefCard: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
    ...Shadow.card,
  },
  prefHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,
  },
  categoryBadge: {
    backgroundColor:   'rgba(249,115,22,0.15)',
    borderColor:       Colors.borderOrange,
    borderWidth:       1,
    borderRadius:      Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
  },
  categoryBadgeText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.orange },
  deleteBtn: {
    width: 28, height: 28,
    borderRadius:    Radius.full,
    backgroundColor: 'rgba(248,113,113,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 13, color: Colors.danger, fontWeight: '700' },

  prefAreaText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },

  prefChips: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
    marginBottom:  Spacing.xs,
  },
  stateChip: {
    backgroundColor:   'rgba(59,130,246,0.12)',
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       'rgba(59,130,246,0.35)',
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  stateChipText: { fontSize: FontSize.xs, color: '#60a5fa', fontWeight: '700' },
  cityChip: {
    backgroundColor:   'rgba(34,197,94,0.10)',
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       'rgba(34,197,94,0.30)',
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  cityChipText: { fontSize: FontSize.xs, color: '#4ade80', fontWeight: '700' },

  radiusBadgeRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  radiusBadge: {
    backgroundColor:   'rgba(129,140,248,0.12)',
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       'rgba(129,140,248,0.30)',
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  radiusBadgeText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600' },

  notifRow: { flexDirection: 'row', gap: 6, marginTop: Spacing.xs, flexWrap: 'wrap' },
  notifOn: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(34,197,94,0.30)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  notifOnText:  { fontSize: FontSize.xs, color: '#22c55e', fontWeight: '600' },
  notifOff: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  notifOffText: { fontSize: FontSize.xs, color: Colors.muted },

  editBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(129,140,248,0.08)',
  },
  editBtnText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '700' },

  // Add / form
  addBtn: {
    borderWidth:  1.5,
    borderColor:  Colors.borderOrange,
    borderStyle:  'dashed',
    borderRadius: Radius.lg,
    padding:      Spacing.md,
    alignItems:   'center',
    marginBottom: Spacing.lg,
  },
  addBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.orange },

  formCard: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.borderOrange,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
    ...Shadow.card,
  },
  formTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.md },

  fieldLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  required:   { color: Colors.orange },

  searchRow: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border2,
    paddingHorizontal: Spacing.sm,
    marginBottom:      Spacing.sm,
  },
  searchIcon:  { fontSize: 14, marginRight: 6 },
  searchInput: {
    flex:     1,
    height:   38,
    fontSize: FontSize.sm,
    color:    Colors.foreground,
  },

  noText: { fontSize: FontSize.sm, color: Colors.muted, marginBottom: Spacing.md },

  groupLabel: {
    fontSize:      FontSize.xs,
    fontWeight:    '700',
    color:         Colors.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  4,
    marginTop:     Spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.xs },
  chip: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.border2,
    backgroundColor:   Colors.panel2,
  },
  chipSelected:     { borderColor: Colors.orange, backgroundColor: 'rgba(249,115,22,0.15)' },
  chipText:         { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: Colors.orange },

  formActions: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    gap:            Spacing.sm,
    marginTop:      Spacing.md,
  },
});
