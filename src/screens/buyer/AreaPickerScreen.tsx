import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { areasApi, preferencesApi, ServiceArea } from '@/lib/api';
import { ScreenShell } from '@/components/ScreenShell';
import { Button } from '@/components/Button';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';

// ── US States ─────────────────────────────────────────────────────────────
const US_STATES = [
  { name: 'Alabama',              code: 'AL' },
  { name: 'Alaska',               code: 'AK' },
  { name: 'Arizona',              code: 'AZ' },
  { name: 'Arkansas',             code: 'AR' },
  { name: 'California',           code: 'CA' },
  { name: 'Colorado',             code: 'CO' },
  { name: 'Connecticut',          code: 'CT' },
  { name: 'Delaware',             code: 'DE' },
  { name: 'Florida',              code: 'FL' },
  { name: 'Georgia',              code: 'GA' },
  { name: 'Hawaii',               code: 'HI' },
  { name: 'Idaho',                code: 'ID' },
  { name: 'Illinois',             code: 'IL' },
  { name: 'Indiana',              code: 'IN' },
  { name: 'Iowa',                 code: 'IA' },
  { name: 'Kansas',               code: 'KS' },
  { name: 'Kentucky',             code: 'KY' },
  { name: 'Louisiana',            code: 'LA' },
  { name: 'Maine',                code: 'ME' },
  { name: 'Maryland',             code: 'MD' },
  { name: 'Massachusetts',        code: 'MA' },
  { name: 'Michigan',             code: 'MI' },
  { name: 'Minnesota',            code: 'MN' },
  { name: 'Mississippi',          code: 'MS' },
  { name: 'Missouri',             code: 'MO' },
  { name: 'Montana',              code: 'MT' },
  { name: 'Nebraska',             code: 'NE' },
  { name: 'Nevada',               code: 'NV' },
  { name: 'New Hampshire',        code: 'NH' },
  { name: 'New Jersey',           code: 'NJ' },
  { name: 'New Mexico',           code: 'NM' },
  { name: 'New York',             code: 'NY' },
  { name: 'North Carolina',       code: 'NC' },
  { name: 'North Dakota',         code: 'ND' },
  { name: 'Ohio',                 code: 'OH' },
  { name: 'Oklahoma',             code: 'OK' },
  { name: 'Oregon',               code: 'OR' },
  { name: 'Pennsylvania',         code: 'PA' },
  { name: 'Rhode Island',         code: 'RI' },
  { name: 'South Carolina',       code: 'SC' },
  { name: 'South Dakota',         code: 'SD' },
  { name: 'Tennessee',            code: 'TN' },
  { name: 'Texas',                code: 'TX' },
  { name: 'Utah',                 code: 'UT' },
  { name: 'Vermont',              code: 'VT' },
  { name: 'Virginia',             code: 'VA' },
  { name: 'Washington',           code: 'WA' },
  { name: 'West Virginia',        code: 'WV' },
  { name: 'Wisconsin',            code: 'WI' },
  { name: 'Wyoming',              code: 'WY' },
];

// ── Radius options ────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '35 mi', value: 35 },
];
const DEFAULT_RADIUS = 25;

// Helper: find state name from code
function stateName(code: string): string {
  return US_STATES.find(s => s.code === code)?.name ?? code;
}

// ── Screen ─────────────────────────────────────────────────────────────────
export function AreaPickerScreen({ route, navigation }: any) {
  const {
    prefId            = null,
    serviceCategory,
    initialAreaIds    = [],
    initialStateCodes = [],
    initialRadius     = DEFAULT_RADIUS,
    notifyEmail:  initEmail = true,
    notifyPush:   initPush  = true,
  } = route.params ?? {};

  // Data
  const [areas,   setAreas]   = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'state' | 'city'>('state');

  // State dropdown open/closed
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  // Search
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch,  setCitySearch]  = useState('');

  // Selections
  const [selStateCodes, setSelStateCodes] = useState<string[]>(initialStateCodes);
  const [selAreaIds,    setSelAreaIds]    = useState<string[]>(initialAreaIds);
  const [radius,        setRadius]        = useState<number>(initialRadius);

  // Notification toggles
  const [notifyEmail, setNotifyEmail] = useState<boolean>(initEmail);
  const [notifyPush,  setNotifyPush]  = useState<boolean>(initPush);

  // Load city areas on mount
  useEffect(() => {
    areasApi.getAll()
      .then(data => { setAreas(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Filtered lists ──────────────────────────────────────────────────────
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return US_STATES;
    const q = stateSearch.toLowerCase();
    return US_STATES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q),
    );
  }, [stateSearch]);

  // Only show city results while user is actively searching.
  // Filter to areas that have coordinates — null-coord DMA entries can't be
  // used for geo-radius matching and would silently give buyers false coverage.
  const filteredAreas = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return [];
    return areas.filter(a =>
      a.lat !== null && a.lng !== null &&
      (
        a.name.toLowerCase().includes(q) ||
        (a.city  ?? '').toLowerCase().includes(q) ||
        (a.state ?? '').toLowerCase().includes(q)
      ),
    );
  }, [areas, citySearch]);

  // Selected city area objects (for chips)
  const selectedAreaObjs = useMemo(
    () => areas.filter(a => selAreaIds.includes(a.id)),
    [areas, selAreaIds],
  );

  // ── Toggles ─────────────────────────────────────────────────────────────
  function toggleState(code: string) {
    setSelStateCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  }

  function toggleArea(id: string) {
    setSelAreaIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
    // If adding a city area, clear city search so results hide
    setCitySearch('');
  }

  // ── Save ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!selStateCodes.length && !selAreaIds.length) {
      Alert.alert(
        'No areas selected',
        'Pick at least one state or city area — or go back to remove this alert entirely.',
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        service_category: serviceCategory,
        area_ids:     selAreaIds,
        state_codes:  selStateCodes,
        radius_miles: selAreaIds.length > 0 ? radius : DEFAULT_RADIUS,
        notify_email: notifyEmail,
        notify_push:  notifyPush,
      };
      if (prefId) {
        await preferencesApi.update(prefId, payload);
      } else {
        await preferencesApi.save(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save areas');
      setSaving(false);
    }
  }

  // ── Total selected count ─────────────────────────────────────────────────
  const totalSelected = selStateCodes.length + selAreaIds.length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScreenShell scrollable>
      {/* ── Back button ─────────────────────────────────────────────────── */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Choose Areas</Text>
        <Text style={styles.screenSubtitle}>{serviceCategory ?? ''}</Text>
      </View>

      {/* ── Tab toggle ─────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'state' && styles.tabActive]}
          onPress={() => setActiveTab('state')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'state' && styles.tabTextActive]}>
            🗺  State
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'city' && styles.tabActive]}
          onPress={() => setActiveTab('city')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'city' && styles.tabTextActive]}>
            🏙  City / Area
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Selected chips ─────────────────────────────────────────────── */}
      {totalSelected > 0 && (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedLabel}>
            Selected ({totalSelected}):
          </Text>
          <View style={styles.chipWrap}>
            {selStateCodes.map(code => (
              <TouchableOpacity
                key={code}
                style={styles.stateChip}
                onPress={() => toggleState(code)}
                activeOpacity={0.8}
              >
                <Text style={styles.stateChipText}>🗺  {stateName(code)}</Text>
                <Text style={styles.chipRemove}>  ×</Text>
              </TouchableOpacity>
            ))}
            {selectedAreaObjs.map(area => (
              <TouchableOpacity
                key={area.id}
                style={styles.cityChip}
                onPress={() => toggleArea(area.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cityChipText}>📍  {area.name}</Text>
                <Text style={styles.chipRemove}>  ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── State tab ──────────────────────────────────────────────────── */}
      {activeTab === 'state' && (
        <View style={styles.tabPanel}>
          <Text style={styles.hint}>
            Select a whole state — any lead with an address in that state will match this alert. No radius needed.
          </Text>

          {/* Dropdown trigger */}
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => {
              setStateDropdownOpen(o => !o);
              if (stateDropdownOpen) setStateSearch('');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownTriggerText}>Add a state…</Text>
            <Text style={styles.dropdownChevron}>{stateDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Dropdown panel */}
          {stateDropdownOpen && (
            <View style={styles.dropdownPanel}>
              {/* Search inside dropdown */}
              <View style={styles.dropdownSearchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search states…"
                  placeholderTextColor={Colors.muted}
                  value={stateSearch}
                  onChangeText={setStateSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>

              {/* Scrollable state list — capped height so it doesn't take over screen */}
              <ScrollView
                style={styles.dropdownList}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredStates.length === 0 ? (
                  <Text style={[styles.noResultText, { paddingHorizontal: Spacing.sm }]}>
                    No states match "{stateSearch}"
                  </Text>
                ) : (
                  filteredStates.map(s => {
                    const sel = selStateCodes.includes(s.code);
                    return (
                      <TouchableOpacity
                        key={s.code}
                        style={[styles.dropdownRow, sel && styles.dropdownRowSelected]}
                        onPress={() => toggleState(s.code)}
                        activeOpacity={0.75}
                      >
                        <View>
                          <Text style={[styles.dropdownRowTitle, sel && styles.listRowTitleSelected]}>
                            {s.name}
                          </Text>
                          <Text style={styles.listRowSub}>{s.code}</Text>
                        </View>
                        {sel && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Done button */}
              <TouchableOpacity
                style={styles.dropdownDone}
                onPress={() => { setStateDropdownOpen(false); setStateSearch(''); }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── City / Area tab ────────────────────────────────────────────── */}
      {activeTab === 'city' && (
        <View style={styles.tabPanel}>
          <Text style={styles.hint}>
            Search for a specific city or metro area. You can also set a radius — leads within that distance will match.
          </Text>

          {/* City search */}
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or area…"
              placeholderTextColor={Colors.muted}
              value={citySearch}
              onChangeText={setCitySearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.md }} />
          ) : citySearch.trim() === '' ? (
            <Text style={styles.noResultText}>
              Type a city name above to search available areas.
            </Text>
          ) : filteredAreas.length === 0 ? (
            <Text style={styles.noResultText}>No areas match "{citySearch}"</Text>
          ) : (
            filteredAreas.map(area => {
              const sel = selAreaIds.includes(area.id);
              return (
                <TouchableOpacity
                  key={area.id}
                  style={[styles.listRow, sel && styles.listRowCitySelected]}
                  onPress={() => toggleArea(area.id)}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text style={[styles.listRowTitle, sel && styles.listRowTitleCitySelected]}>
                      {area.name}
                    </Text>
                    <Text style={styles.listRowSub}>{area.city}, {area.state}</Text>
                  </View>
                  {sel && <Text style={styles.checkmarkCity}>✓</Text>}
                </TouchableOpacity>
              );
            })
          )}

          {/* Radius picker (only when city areas are selected) */}
          {selAreaIds.length > 0 && (
            <View style={styles.radiusSection}>
              <Text style={styles.radiusLabel}>
                Radius for city areas{' '}
                <Text style={styles.radiusHint}>(max 35 mi)</Text>
              </Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.radiusBtn, radius === opt.value && styles.radiusBtnSelected]}
                    onPress={() => setRadius(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.radiusBtnText, radius === opt.value && styles.radiusBtnTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.radiusDesc}>
                Leads within {radius} mile{radius > 1 ? 's' : ''} of your selected city area{selAreaIds.length > 1 ? 's' : ''} will match.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Notification toggles ─────────────────────────────────────────── */}
      <View style={styles.notifSection}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>📧  Email alerts</Text>
          <Switch
            value={notifyEmail}
            onValueChange={setNotifyEmail}
            trackColor={{ false: Colors.panel2, true: Colors.orange }}
            thumbColor={Colors.foreground}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>📱  Push notifications</Text>
          <Switch
            value={notifyPush}
            onValueChange={setNotifyPush}
            trackColor={{ false: Colors.panel2, true: Colors.orange }}
            thumbColor={Colors.foreground}
          />
        </View>
      </View>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <View style={styles.saveRow}>
        <Button variant="ghost"   label="Cancel" onPress={() => navigation.goBack()} />
        <Button variant="primary" label={prefId ? 'Save Changes' : 'Save Alert'} loading={saving} onPress={handleSave} />
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScreenShell>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Tab toggle
  tabRow: {
    flexDirection:   'row',
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border2,
    padding:         3,
    marginBottom:    Spacing.md,
  },
  tab: {
    flex:            1,
    paddingVertical: 9,
    borderRadius:    Radius.md,
    alignItems:      'center',
  },
  tabActive: {
    backgroundColor: Colors.panel,
    ...Shadow.card,
  },
  tabText: {
    fontSize:   FontSize.sm,
    fontWeight: '700',
    color:      Colors.muted,
  },
  tabTextActive: { color: Colors.foreground },

  // Selected chips box
  selectedBox: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.sm,
    marginBottom:    Spacing.md,
    ...Shadow.card,
  },
  selectedLabel: {
    fontSize:     FontSize.xs,
    fontWeight:   '700',
    color:        Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  stateChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(59,130,246,0.15)',
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       'rgba(59,130,246,0.40)',
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  stateChipText: { fontSize: FontSize.xs, color: '#60a5fa', fontWeight: '700' },
  cityChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(34,197,94,0.12)',
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       'rgba(34,197,94,0.35)',
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  cityChipText: { fontSize: FontSize.xs, color: '#4ade80', fontWeight: '700' },
  chipRemove:   { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '700' },

  // Tab panels
  tabPanel: { marginBottom: Spacing.sm },

  hint: {
    fontSize:     FontSize.xs,
    color:        Colors.muted,
    lineHeight:   18,
    marginBottom: Spacing.sm,
  },

  // State dropdown
  dropdownTrigger: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border2,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   13,
  },
  dropdownTriggerText: {
    fontSize: FontSize.sm,
    color:    Colors.textSecondary,
  },
  dropdownChevron: {
    fontSize: 11,
    color:    Colors.accent,
  },
  dropdownPanel: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginTop:       4,
    overflow:        'hidden',
    ...Shadow.card,
  },
  dropdownSearchRow: {
    flexDirection:     'row',
    alignItems:        'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    paddingHorizontal: Spacing.sm,
    backgroundColor:   Colors.panel2,
  },
  dropdownList: {
    maxHeight: 260,
  },
  dropdownRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   11,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
  },
  dropdownRowSelected: {
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  dropdownRowTitle: {
    fontSize:   FontSize.sm,
    color:      Colors.text,
    fontWeight: '600',
  },
  dropdownDone: {
    paddingVertical: 11,
    alignItems:      'center',
    borderTopWidth:  1,
    borderTopColor:  Colors.border2,
    backgroundColor: Colors.panel2,
  },
  dropdownDoneText: {
    fontSize:   FontSize.sm,
    color:      Colors.accent,
    fontWeight: '700',
  },

  // Search bar
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
    height:   40,
    fontSize: FontSize.sm,
    color:    Colors.foreground,
  },

  // List rows
  listRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   11,
    paddingHorizontal: Spacing.sm,
    borderRadius:      Radius.md,
    marginBottom:      3,
    backgroundColor:   Colors.panel2,
    borderWidth:       1,
    borderColor:       Colors.border2,
  },
  listRowSelected: {
    borderColor:     'rgba(59,130,246,0.50)',
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  listRowCitySelected: {
    borderColor:     'rgba(34,197,94,0.40)',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  listRowTitle:             { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
  listRowTitleSelected:     { color: '#60a5fa' },
  listRowTitleCitySelected: { color: '#4ade80' },
  listRowSub:               { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  checkmark:     { fontSize: 15, color: '#60a5fa', fontWeight: '700' },
  checkmarkCity: { fontSize: 15, color: '#4ade80', fontWeight: '700' },

  noResultText: { fontSize: FontSize.sm, color: Colors.muted, marginBottom: Spacing.sm },

  // Radius
  radiusSection: {
    marginTop:    Spacing.md,
    paddingTop:   Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border2,
  },
  radiusLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  radiusHint:  { fontWeight: '400', color: Colors.muted },
  radiusRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: 6 },
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
  radiusDesc:            { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 17 },

  // Notification section
  notifSection: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginTop:       Spacing.sm,
    marginBottom:    Spacing.md,
    ...Shadow.card,
  },
  sectionLabel: {
    fontSize:      FontSize.sm,
    fontWeight:    '700',
    color:         Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  Spacing.sm,
  },
  toggleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel: { fontSize: FontSize.sm, color: Colors.text },

  // Save row
  saveRow: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    gap:            Spacing.sm,
    marginTop:      Spacing.xs,
  },

  // Back button (matches LeadDetailScreen pattern)
  backRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: FontSize.lg, color: Colors.orange, lineHeight: 26 },
  backLabel: { fontSize: FontSize.base, color: Colors.orange, fontWeight: '600' },

  // Screen header
  screenHeader:   { marginBottom: Spacing.xs },
  screenTitle:    { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  screenSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
});
