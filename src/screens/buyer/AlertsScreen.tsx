import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import {
  areasApi, categoriesApi, preferencesApi,
  ServiceArea, ServiceCategory, Preference,
} from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';

// ── Radius options (max 35 miles) ─────────────────────────────────────────
const RADIUS_OPTIONS = [
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '35 mi', value: 35 },
];
const DEFAULT_RADIUS = 25;

// ── AreaPicker ────────────────────────────────────────────────────────────
// Search bar + collapsible state sections
function AreaPicker({
  areas,
  selected,
  onToggle,
}: {
  areas: ServiceArea[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [query,         setQuery]         = useState('');
  const [expandedState, setExpandedState] = useState<string | null>(null);

  // All unique states, sorted
  const states = useMemo(
    () => [...new Set(areas.map(a => a.state || 'Other'))].sort(),
    [areas],
  );

  // Filtered areas when searching
  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return areas.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        (a.city ?? '').toLowerCase().includes(q) ||
        (a.state ?? '').toLowerCase().includes(q),
    );
  }, [areas, query]);

  function areasForState(state: string) {
    return areas.filter(a => (a.state || 'Other') === state);
  }

  function toggleState(state: string) {
    setExpandedState(prev => (prev === state ? null : state));
  }

  return (
    <View>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search city or state…"
          placeholderTextColor={Colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Search results (flat list) */}
      {filtered !== null ? (
        filtered.length === 0 ? (
          <Text style={styles.noAreasText}>No areas match "{query}"</Text>
        ) : (
          <View style={styles.flatList}>
            {filtered.map(area => {
              const sel = selected.has(area.id);
              return (
                <TouchableOpacity
                  key={area.id}
                  style={[styles.areaRow, sel && styles.areaRowSelected]}
                  onPress={() => onToggle(area.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.areaRowText, sel && styles.areaRowTextSelected]}>
                    {area.name}, {area.state}
                  </Text>
                  {sel && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )
      ) : (
        /* State accordion */
        <View>
          {states.map(state => {
            const stateAreas  = areasForState(state);
            const expanded    = expandedState === state;
            const selCount    = stateAreas.filter(a => selected.has(a.id)).length;

            return (
              <View key={state} style={styles.stateSection}>
                <TouchableOpacity
                  style={styles.stateHeader}
                  onPress={() => toggleState(state)}
                  activeOpacity={0.75}
                >
                  <View style={styles.stateHeaderLeft}>
                    <Text style={styles.stateName}>{state}</Text>
                    <Text style={styles.stateCount}>
                      {stateAreas.length} area{stateAreas.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.stateHeaderRight}>
                    {selCount > 0 && (
                      <View style={styles.selBadge}>
                        <Text style={styles.selBadgeText}>{selCount} selected</Text>
                      </View>
                    )}
                    <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.stateBody}>
                    {stateAreas.map(area => {
                      const sel = selected.has(area.id);
                      return (
                        <TouchableOpacity
                          key={area.id}
                          style={[styles.areaRow, sel && styles.areaRowSelected]}
                          onPress={() => onToggle(area.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.areaRowText, sel && styles.areaRowTextSelected]}>
                            {area.name}
                          </Text>
                          {sel && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export function AlertsScreen() {
  const [areas,       setAreas]       = useState<ServiceArea[]>([]);
  const [categories,  setCategories]  = useState<ServiceCategory[]>([]);
  const [prefs,       setPrefs]       = useState<Preference[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  // Form state (used for both create + edit)
  const [editingPref, setEditingPref] = useState<Preference | null>(null); // null = creating new
  const [selCategory, setSelCategory] = useState<string | null>(null);
  const [selAreaIds,  setSelAreaIds]  = useState<Set<string>>(new Set());
  const [selRadius,   setSelRadius]   = useState<number>(DEFAULT_RADIUS);
  const [selEmail,    setSelEmail]    = useState(true);
  const [selPush,     setSelPush]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [catSearch,   setCatSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedAreas, fetchedCats, fetchedPrefs] = await Promise.all([
        areasApi.getAll(),
        categoriesApi.getAll(),
        preferencesApi.get(),
      ]);
      setAreas(fetchedAreas);
      setCategories(fetchedCats);
      setPrefs(fetchedPrefs);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleArea(id: string) {
    setSelAreaIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openEdit(pref: Preference) {
    setEditingPref(pref);
    setSelCategory(pref.service_category);
    setSelAreaIds(new Set(pref.area_ids));
    setSelRadius(pref.radius_miles ?? DEFAULT_RADIUS);
    setSelEmail(pref.notify_email ?? true);
    setSelPush(pref.notify_push  ?? true);
    setCatSearch('');
    setShowForm(true);
  }

  function resetForm() {
    setEditingPref(null);
    setSelCategory(null);
    setSelAreaIds(new Set());
    setSelRadius(DEFAULT_RADIUS);
    setSelEmail(true);
    setSelPush(true);
    setCatSearch('');
    setShowForm(false);
  }

  async function handleSave() {
    if (!selCategory) {
      Alert.alert('Choose a category', 'Pick a category for this alert.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        service_category: selCategory,
        area_ids:         Array.from(selAreaIds),
        radius_miles:     selAreaIds.size > 0 ? selRadius : DEFAULT_RADIUS,
        notify_email:     selEmail,
        notify_push:      selPush,
      };
      if (editingPref) {
        await preferencesApi.update(editingPref.id, payload);
      } else {
        await preferencesApi.save(payload);
      }
      resetForm();
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save alert');
    } finally {
      setSaving(false);
    }
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
            setPrefs(p => p.filter(x => x.id !== id));
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
    return a ? `${a.name}, ${a.state}` : id;
  }

  // Filtered categories for the picker
  const filteredCats = useMemo(() => {
    if (!catSearch.trim()) return categories;
    const q = catSearch.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, catSearch]);

  // Group filtered categories by group_name
  const catGroups = useMemo(() => {
    const map: Record<string, ServiceCategory[]> = {};
    for (const cat of filteredCats) {
      const g = cat.group_name || 'Other';
      (map[g] ??= []).push(cat);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCats]);

  return (
    <ScreenShell title="Lead Alerts" subtitle="Get notified when matching leads go live" scrollable>

      {/* ── Saved alerts ─────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Your Alerts</Text>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
      ) : prefs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyText}>
            Add an alert below and we'll notify you as soon as a matching lead is published.
          </Text>
        </View>
      ) : (
        prefs.map(pref => (
          <View key={pref.id} style={styles.prefCard}>
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

            {pref.area_ids.length === 0 ? (
              <Text style={styles.prefAreaText}>📍 All areas (nationwide)</Text>
            ) : (
              <View style={styles.prefAreas}>
                {pref.area_ids.map(id => (
                  <View key={id} style={styles.areaTag}>
                    <Text style={styles.areaTagText}>{areaName(id)}</Text>
                  </View>
                ))}
              </View>
            )}

            {pref.area_ids.length > 0 && (
              <View style={styles.radiusBadgeRow}>
                <View style={styles.radiusBadge}>
                  <Text style={styles.radiusBadgeText}>
                    📡 {pref.radius_miles ?? DEFAULT_RADIUS} mi radius
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.notifRow}>
              {pref.notify_email
                ? <View style={styles.notifBadgeOn}><Text style={styles.notifBadgeOnText}>📧 Email on</Text></View>
                : <View style={styles.notifBadgeOff}><Text style={styles.notifBadgeOffText}>📧 Email off</Text></View>
              }
              {pref.notify_push
                ? <View style={styles.notifBadgeOn}><Text style={styles.notifBadgeOnText}>📱 Push on</Text></View>
                : <View style={styles.notifBadgeOff}><Text style={styles.notifBadgeOffText}>📱 Push off</Text></View>
              }
            </View>

            {/* Edit button */}
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(pref)} activeOpacity={0.75}>
              <Text style={styles.editBtnText}>✏️  Edit Alert</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* ── Add new alert ─────────────────────────────────────────────── */}
      {!showForm ? (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>＋ Add New Alert</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingPref ? '✏️  Edit Alert' : 'New Alert'}</Text>

          {/* ── Category picker ── */}
          <Text style={styles.fieldLabel}>
            Category <Text style={styles.required}>*</Text>
          </Text>

          {/* Category search */}
          <View style={[styles.searchRow, { marginBottom: Spacing.xs }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
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
            <Text style={styles.noAreasText}>No categories match "{catSearch}"</Text>
          ) : (
            catGroups.map(([group, cats]) => (
              <View key={group} style={{ marginBottom: Spacing.xs }}>
                <Text style={styles.stateLabel}>{group}</Text>
                <View style={styles.chipRow}>
                  {cats.map(cat => {
                    const sel = selCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, sel && styles.chipSelected]}
                        onPress={() => setSelCategory(prev => prev === cat.name ? null : cat.name)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          {/* ── Area picker ── */}
          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
            Areas{' '}
            <Text style={styles.fieldHint}>(optional — leave empty for all areas)</Text>
          </Text>

          {areas.length === 0 ? (
            <Text style={styles.noAreasText}>No service areas configured yet.</Text>
          ) : (
            <AreaPicker
              areas={areas}
              selected={selAreaIds}
              onToggle={toggleArea}
            />
          )}

          {/* ── Radius picker ── */}
          {selAreaIds.size > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.fieldLabel}>
                Radius <Text style={styles.fieldHint}>(max 35 miles)</Text>
              </Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.radiusBtn, selRadius === opt.value && styles.radiusBtnSelected]}
                    onPress={() => setSelRadius(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.radiusBtnText, selRadius === opt.value && styles.radiusBtnTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.radiusHint}>
                Notify me for leads within {selRadius} mile{selRadius > 1 ? 's' : ''} of my selected area{selAreaIds.size > 1 ? 's' : ''}.
              </Text>
            </View>
          )}

          {/* Summary */}
          {(selCategory || selAreaIds.size > 0) && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                {selCategory ? `📂 ${selCategory}` : '📂 No category selected'}
                {'  ·  '}
                {selAreaIds.size === 0
                  ? '📍 All areas'
                  : `📍 ${selAreaIds.size} area${selAreaIds.size > 1 ? 's' : ''} · 📡 ${selRadius} mi`
                }
              </Text>
            </View>
          )}

          {/* Notification toggles */}
          <View style={[styles.notifToggles, { marginTop: Spacing.md }]}>
            <Text style={styles.fieldLabel}>Notifications</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>📧  Email alerts</Text>
              <Switch
                value={selEmail}
                onValueChange={setSelEmail}
                trackColor={{ false: Colors.panel2, true: Colors.orange }}
                thumbColor={Colors.foreground}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>📱  Push notifications</Text>
              <Switch
                value={selPush}
                onValueChange={setSelPush}
                trackColor={{ false: Colors.panel2, true: Colors.orange }}
                thumbColor={Colors.foreground}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.formActions}>
            <Button variant="ghost" label="Cancel" onPress={resetForm} />
            <Button variant="primary" label="Save Alert" loading={saving} onPress={handleSave} />
          </View>
        </View>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScreenShell>
  );
}

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

  prefCard: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     1,
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

  prefAreas:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.xs },
  prefAreaText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  areaTag: {
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.border2,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  areaTagText: { fontSize: FontSize.xs, color: Colors.text },

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
  notifBadgeOn: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(34,197,94,0.30)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  notifBadgeOnText: { fontSize: FontSize.xs, color: '#22c55e', fontWeight: '600' },
  notifBadgeOff: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  notifBadgeOffText: { fontSize: FontSize.xs, color: Colors.muted },

  editBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: 'rgba(129,140,248,0.08)',
  },
  editBtnText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '700' },

  notifToggles: { gap: 4 },
  toggleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel:  { fontSize: FontSize.sm, color: Colors.text },

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
    borderWidth:     1,
    borderColor:     Colors.borderOrange,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
    ...Shadow.card,
  },
  formTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.md },

  fieldLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  fieldHint:  { fontWeight: '400', color: Colors.muted },
  required:   { color: Colors.orange },

  // Search bar
  searchRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border2,
    paddingHorizontal: Spacing.sm,
    marginBottom:    Spacing.sm,
  },
  searchIcon:  { fontSize: 14, marginRight: 6 },
  searchInput: {
    flex:      1,
    height:    38,
    fontSize:  FontSize.sm,
    color:     Colors.foreground,
  },

  // Flat search results
  flatList: { marginBottom: Spacing.xs },

  // Area rows (in search results and state body)
  areaRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   10,
    paddingHorizontal: Spacing.sm,
    borderRadius:      Radius.md,
    marginBottom:      3,
    backgroundColor:   Colors.panel2,
    borderWidth:       1,
    borderColor:       Colors.border2,
  },
  areaRowSelected: {
    borderColor:     Colors.orange,
    backgroundColor: 'rgba(249,115,22,0.10)',
  },
  areaRowText:         { fontSize: FontSize.sm, color: Colors.text },
  areaRowTextSelected: { color: Colors.orange, fontWeight: '600' },
  checkmark:           { fontSize: 14, color: Colors.orange, fontWeight: '700' },

  // State accordion
  stateSection: { marginBottom: 6 },
  stateHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   10,
    paddingHorizontal: Spacing.sm,
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border2,
  },
  stateHeaderLeft:  { flex: 1 },
  stateHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stateName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.foreground },
  stateCount: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  chevron:    { fontSize: 10, color: Colors.muted },
  selBadge: {
    backgroundColor:   'rgba(249,115,22,0.15)',
    borderRadius:      Radius.full,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  selBadgeText: { fontSize: FontSize.xs, color: Colors.orange, fontWeight: '700' },
  stateBody: { paddingLeft: Spacing.sm, marginTop: 3 },

  // Category chips
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

  stateLabel: {
    fontSize:      FontSize.xs,
    fontWeight:    '700',
    color:         Colors.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  4,
    marginTop:     Spacing.xs,
  },

  noAreasText: { fontSize: FontSize.sm, color: Colors.muted, marginBottom: Spacing.md },

  // Radius selector
  radiusRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
  radiusBtn: {
    flex:            1,
    paddingVertical: Spacing.sm,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border2,
    backgroundColor: Colors.panel2,
    alignItems:      'center',
  },
  radiusBtnSelected:     { borderColor: Colors.accent, backgroundColor: 'rgba(129,140,248,0.15)' },
  radiusBtnText:         { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  radiusBtnTextSelected: { color: Colors.accent },
  radiusHint: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 17, marginBottom: Spacing.xs },

  summaryBox: {
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    padding:         Spacing.sm,
    marginTop:       Spacing.sm,
    marginBottom:    Spacing.xs,
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.accent, textAlign: 'center' },

  formActions: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    gap:            Spacing.sm,
    marginTop:      Spacing.md,
  },
});
