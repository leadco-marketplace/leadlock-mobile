/**
 * SubmitLeadScreen — Complete overhaul to match web browser experience.
 *
 * Changes from the old broken form:
 *  • Searchable category picker (full-screen modal, grouped, filterable)
 *  • Dynamic job type picker (modal, category-specific options from API)
 *  • Address autocomplete for needsAddress categories (Nominatim)
 *  • City / state inputs for all other categories
 *  • Customer contact fields (name, phone, email — at least one required)
 *  • Dynamic extra fields (urgency, budget, property type, etc.) from API
 *  • Decay pricing toggle (% drop, interval, floor price)
 *  • Duplicate contact detection with inline warning
 *  • auto_publish / review flow based on category config
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTagsForCategory } from '../../lib/leadTags';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Input }       from '@/components/Input';
import { Button }      from '@/components/Button';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius, Shadow } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  categoriesApi,
  leadFieldsApi,
  placesApi,
  BASE,
  authHeaders,
  ServiceCategory,
  LeadFieldConfig,
  LeadExtraField,
  PlacePrediction,
} from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve job types for a specific category from the loaded config. */
function resolveJobTypes(config: LeadFieldConfig, categoryName: string): string[] {
  const specific = config.categoryJobTypes?.[categoryName];
  return specific && specific.length > 0 ? specific : config.jobTypeOptions;
}

/** Resolve extra fields for a specific category + job type. */
function resolveExtraFields(config: LeadFieldConfig, jobType: string, categoryName: string): LeadExtraField[] {
  if (jobType && config.jobTypeFields?.[jobType]) return config.jobTypeFields[jobType];
  if (categoryName && config.categoryExtraFields?.[categoryName]) return config.categoryExtraFields[categoryName];
  return config.extraFields;
}

// ── Generic Modal Picker ──────────────────────────────────────────────────────

interface PickerModalProps {
  visible:   boolean;
  title:     string;
  options:   string[];
  value:     string;
  onSelect:  (v: string) => void;
  onClose:   () => void;
}

function PickerModal({ visible, title, options, value, onSelect, onClose }: PickerModalProps) {
  useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[pm.sheet, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange }]}>
        <View style={[pm.handle, { backgroundColor: Colors.muted }]} />
        <Text style={[pm.title, { color: Colors.foreground }]}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          style={{ maxHeight: 380 }}
          ItemSeparatorComponent={() => <View style={pm.sep} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[pm.option, value === item && pm.optionActive]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[pm.optionText, { color: Colors.text }, value === item && pm.optionTextActive]}>
                {item}
              </Text>
              {value === item && <Text style={pm.check}>✓</Text>}
            </TouchableOpacity>
          )}
        />
        <Button label="Cancel" onPress={onClose} variant="secondary" style={pm.cancel} />
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.panel,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 16,
    paddingTop: Spacing.md,
  },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.muted, alignSelf: 'center', marginBottom: Spacing.sm },
  title:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.md, textAlign: 'center' },
  sep:      { height: 1, backgroundColor: Colors.border, marginHorizontal: -Spacing.lg },
  option:   { paddingVertical: Spacing.sm + 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionActive: { backgroundColor: 'rgba(249,115,22,0.06)', borderRadius: Radius.md, paddingHorizontal: Spacing.sm, marginHorizontal: -Spacing.sm },
  optionText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  optionTextActive: { color: Colors.orange, fontWeight: '600' },
  check:    { fontSize: FontSize.sm, color: Colors.orange, fontWeight: '700' },
  cancel:   { marginTop: Spacing.md },
});

// ── Inline Select Field (tap to open PickerModal) ──────────────────────────────

interface SelectFieldProps {
  label:     string;
  value:     string;
  options:   string[];
  required?: boolean;
  onChange:  (v: string) => void;
}

function SelectField({ label, value, options, required, onChange }: SelectFieldProps) {
  useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <View style={sf.container}>
        <Text style={[sf.label, { color: Colors.muted }]}>{label}{required ? ' *' : ''}</Text>
        <TouchableOpacity
          style={[sf.box, { backgroundColor: Colors.panel2 }, value && sf.boxActive]}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={[sf.text, { color: Colors.foreground }, !value && { color: Colors.placeholder }]}>
            {value || 'Select…'}
          </Text>
          <Text style={sf.arrow}>›</Text>
        </TouchableOpacity>
      </View>
      <PickerModal
        visible={open}
        title={label}
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const sf = StyleSheet.create({
  container: { gap: 6 },
  label:     { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  box: {
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       'rgba(59,130,246,0.28)',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    flexDirection:     'row',
    alignItems:        'center',
  },
  boxActive:   { borderColor: 'rgba(249,115,22,0.55)' },
  text:        { flex: 1, fontSize: FontSize.base, color: Colors.foreground },
  placeholder: { color: Colors.placeholder },
  arrow:       { fontSize: 18, color: Colors.muted, fontWeight: '300' },
});

// ── Address Autocomplete Input ──────────────────────────────────────────────────

interface AddressResult {
  description: string;
  city:        string;
  state:       string;
  lat:         number;
  lng:         number;
  street?:     string; // Populated when searchType="address"
}

interface AddressAutocompleteInputProps {
  label:       string;
  placeholder: string;
  value:       string;
  onSelect:    (result: AddressResult) => void;
  onClear:     () => void;
  searchType?: 'city' | 'address'; // "address" → full street-level search
}

function AddressAutocompleteInput({
  label,
  placeholder,
  value,
  onSelect,
  onClear,
  searchType,
}: AddressAutocompleteInputProps) {
  const [query,          setQuery]          = useState(value);
  const [suggestions,    setSuggestions]    = useState<PlacePrediction[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [confirmed,      setConfirmed]      = useState(!!value);
  const [confirmedCity,  setConfirmedCity]  = useState('');
  const [confirmedState, setConfirmedState] = useState('');
  useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When value is reset externally (form reset), clear local state
  useEffect(() => {
    if (!value) { setQuery(''); setSuggestions([]); setConfirmed(false); }
  }, [value]);

  function handleChangeText(text: string) {
    setQuery(text);
    setConfirmed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Address search needs more chars to get useful results from Nominatim
    const minLen = searchType === 'address' ? 5 : 2;
    if (text.length < minLen) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await placesApi.autocomplete(text, searchType ?? 'city');
        setSuggestions(results);
      } catch { /* ignore network errors */ }
      finally { setLoading(false); }
    }, 400);
  }

  function pickSuggestion(item: PlacePrediction) {
    setQuery(item.description);
    setSuggestions([]);
    setConfirmed(true);
    setConfirmedCity(item.city ?? '');
    setConfirmedState(item.state ?? '');
    onSelect({ description: item.description, city: item.city, state: item.state, lat: item.lat, lng: item.lng, street: item.street });
  }

  function clearInput() {
    setQuery('');
    setSuggestions([]);
    setConfirmed(false);
    setConfirmedCity('');
    setConfirmedState('');
    onClear();
  }

  return (
    <View style={ac.container}>
      <Text style={[ac.label, { color: Colors.muted }]}>{label}</Text>
      <View style={[ac.inputRow, { backgroundColor: Colors.panel2 }, confirmed && ac.inputConfirmed]}>
        <TextInput
          style={[ac.input, { color: Colors.foreground }]}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearInput} style={ac.clearBtn}>
            <Text style={ac.clearX}>×</Text>
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="small" color={Colors.orange} style={{ marginRight: 8 }} />}
      </View>
      {confirmed && (
        <Text style={ac.confirmedHint}>
          {confirmedCity ? `✓ ${confirmedCity}${confirmedState ? `, ${confirmedState}` : ''}` : '✓ Location set'}
        </Text>
      )}
      {suggestions.length > 0 && (
        <View style={[ac.dropdown, { backgroundColor: Colors.panel2, shadowColor: Colors.glowColor }]}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={ac.suggestion}
              onPress={() => pickSuggestion(item)}
            >
              <Text style={[ac.suggestionText, { color: Colors.text }]}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  container:       { gap: 4 },
  label:           { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     'rgba(59,130,246,0.28)',
    paddingHorizontal: Spacing.md,
  },
  inputConfirmed: { borderColor: 'rgba(52,211,153,0.55)' },
  input:          { flex: 1, fontSize: FontSize.base, color: Colors.foreground, paddingVertical: Spacing.sm + 4 },
  clearBtn:       { paddingHorizontal: 4 },
  clearX:         { fontSize: 20, color: Colors.muted, lineHeight: 22 },
  confirmedHint:  { fontSize: FontSize.xs, color: Colors.good, marginTop: 2 },
  dropdown: {
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.borderOrange,
    marginTop:       2,
    ...Shadow.card,
  },
  suggestion: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: { fontSize: FontSize.sm, color: Colors.text },
});

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  useTheme();
  return (
    <View style={sh.wrap}>
      <Text style={[sh.title, { color: Colors.foreground }]}>{title}</Text>
      {subtitle && <Text style={[sh.sub, { color: Colors.muted }]}>{subtitle}</Text>}
    </View>
  );
}

const sh = StyleSheet.create({
  wrap:  { gap: 3, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.foreground },
  sub:   { fontSize: FontSize.xs, color: Colors.muted },
});

// ── Extra Field Renderer ───────────────────────────────────────────────────────

interface ExtraFieldInputProps {
  field:    LeadExtraField;
  value:    string;
  onChange: (v: string) => void;
}

function ExtraFieldInput({ field, value, onChange }: ExtraFieldInputProps) {
  useTheme();
  if (field.type === 'select' && field.options) {
    return (
      <SelectField
        label={field.label}
        value={value}
        options={field.options}
        required={field.required}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'textarea') {
    return null; // Free-text descriptions removed — chip selector handles context
  }
  return (
    <Input
      label={field.label + (field.required ? ' *' : '')}
      value={value}
      onChangeText={onChange}
      placeholder={field.placeholder}
      keyboardType={field.type === 'tel' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'}
    />
  );
}

// ── Category Search Modal ──────────────────────────────────────────────────────

interface CategoryModalProps {
  visible:    boolean;
  categories: ServiceCategory[];
  onSelect:   (cat: ServiceCategory) => void;
  onClose:    () => void;
}

function CategoryModal({ visible, categories, onSelect, onClose }: CategoryModalProps) {
  useTheme();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? categories.filter(c =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        (c.group_name ?? '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : categories;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[cat.container, { backgroundColor: Colors.bg }]}>
        {/* Header */}
        <View style={cat.header}>
          <TouchableOpacity onPress={onClose} style={cat.backBtn}>
            <Text style={[cat.backText, { color: Colors.orange }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[cat.headerTitle, { color: Colors.foreground }]}>Select Category</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Search */}
        <View style={[cat.searchRow, { backgroundColor: Colors.panel2, borderColor: Colors.borderOrange }]}>
          <Text style={cat.searchIcon}>🔍</Text>
          <TextInput
            style={[cat.searchInput, { color: Colors.foreground }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories (e.g. Plumbing, Mortgage…)"
            placeholderTextColor={Colors.placeholder}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>

        {/* Results */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: Spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[cat.card, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}
              onPress={() => { onSelect(item); setQuery(''); }}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={[cat.catName, { color: Colors.foreground }]}>{item.name}</Text>
                {item.group_name && (
                  <Text style={[cat.groupName, { color: Colors.muted }]}>{item.group_name}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 48, gap: 8 }}>
              <Text style={{ fontSize: 32 }}>🔍</Text>
              <Text style={{ fontSize: FontSize.sm, color: Colors.muted }}>
                No categories match "{query}"
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const cat = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  backBtn:   { width: 60 },
  backText:  { fontSize: FontSize.sm, color: Colors.orange, fontWeight: '600' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.foreground },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.panel2, borderRadius: Radius.lg, marginHorizontal: Spacing.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.borderOrange, gap: 8 },
  searchIcon: { fontSize: 15, color: Colors.muted },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.foreground, paddingVertical: Spacing.sm + 2 },
  card: {
    backgroundColor:   Colors.panel,
    borderRadius:      Radius.lg,
    borderWidth:       2,
    borderColor:       Colors.borderOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    ...Shadow.card,
  },
  catName:   { fontSize: FontSize.sm, fontWeight: '600', color: Colors.foreground },
  groupName: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
});

// ── Lead Context Tags ─────────────────────────────────────────────────────────

interface LeadTagChipsProps {
  tags: { emoji: string; label: string }[];
  selected: string[];
  onToggle: (label: string) => void;
}

function LeadTagChips({ tags, selected, onToggle }: LeadTagChipsProps) {
  useTheme();
  return (
    <View style={tc.wrap}>
      {tags.map(({ emoji, label }) => {
        const active = selected.includes(label);
        return (
          <TouchableOpacity
            key={label}
            style={[tc.chip, active && tc.chipActive]}
            onPress={() => onToggle(label)}
            activeOpacity={0.7}
          >
            <Text style={tc.chipEmoji}>{emoji}</Text>
            <Text style={[tc.chipText, active && tc.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tc = StyleSheet.create({
  wrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   7,
    borderRadius:      20,
    borderWidth:       1.5,
    borderColor:       'rgba(59,130,246,0.28)',
    backgroundColor:   'rgba(59,130,246,0.06)',
  },
  chipActive: {
    borderColor:     Colors.orange,
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  chipEmoji:     { fontSize: 13 },
  chipText:      { fontSize: 13, color: Colors.muted, fontWeight: '500' },
  chipTextActive:{ color: Colors.orange, fontWeight: '600' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export function SubmitLeadScreen({ navigation }: any) {
  useTheme();
  // ── Meta ──
  const [allCategories,  setAllCategories]  = useState<ServiceCategory[]>([]);
  const [catModalOpen,   setCatModalOpen]   = useState(false);
  const [selectedCat,    setSelectedCat]    = useState<ServiceCategory | null>(null);
  const [fieldConfig,    setFieldConfig]    = useState<LeadFieldConfig | null>(null);
  const [configLoading,  setConfigLoading]  = useState(false);

  // ── Form fields ──
  const [jobType,        setJobType]        = useState('');
  const [jtModalOpen,    setJtModalOpen]    = useState(false);
  const [nationwide,     setNationwide]     = useState(false);
  // For needsAddress categories:
  const [streetAddress,  setStreetAddress]  = useState('');
  const [addrCity,       setAddrCity]       = useState('');
  const [addrState,      setAddrState]      = useState('');
  const [addrLat,        setAddrLat]        = useState<number | null>(null);
  const [addrLng,        setAddrLng]        = useState<number | null>(null);
  // For non-needsAddress categories:
  const [cityInput,      setCityInput]      = useState('');
  const [stateInput,     setStateInput]     = useState('');
  const [cityLat,        setCityLat]        = useState<number | null>(null);
  const [cityLng,        setCityLng]        = useState<number | null>(null);
  // Contact
  const [customerName,   setCustomerName]   = useState('');
  const [customerPhone,  setCustomerPhone]  = useState('');
  const [customerEmail,  setCustomerEmail]  = useState('');
  // Extra fields
  const [extraValues,    setExtraValues]    = useState<Record<string, string>>({});
  // Lead context chips + price
  const [selectedTags,   setSelectedTags]   = useState<string[]>([]);
  const [price,          setPrice]          = useState('');
  // Decay pricing
  const [decayEnabled,   setDecayEnabled]   = useState(false);
  const [decayPct,       setDecayPct]       = useState('10');
  const [decayHrs,       setDecayHrs]       = useState('2');
  const [decayFloor,     setDecayFloor]     = useState('');
  const [decayPctOpen,   setDecayPctOpen]   = useState(false);
  const [decayHrsOpen,   setDecayHrsOpen]   = useState(false);
  // Status
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [success,        setSuccess]        = useState(false);
  const [successLive,    setSuccessLive]    = useState(false);
  const [duplicateInfo,  setDuplicateInfo]  = useState<{
    existingDate: string;
    existingCategory: string;
    existingLeadCode: string | null;
    hardBlock: boolean;
    matchedOn: 'phone' | 'email' | null;
    existingLeadId: string;
  } | null>(null);

  // ── Load categories on mount ──
  useEffect(() => {
    categoriesApi.getAll()
      .then(setAllCategories)
      .catch(() => {});
  }, []);

  // ── Load field config when category changes ──
  useEffect(() => {
    if (!selectedCat || !selectedCat.group_name) { setFieldConfig(null); return; }
    setConfigLoading(true);
    setJobType('');
    setExtraValues({});
    leadFieldsApi.getConfig(selectedCat.group_name, selectedCat.name)
      .then(setFieldConfig)
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, [selectedCat]);

  // ── Active job types and fields ──
  const activeJobTypes = fieldConfig ? resolveJobTypes(fieldConfig, selectedCat?.name ?? '') : [];
  const activeFields   = (fieldConfig && jobType)
    ? resolveExtraFields(fieldConfig, jobType, selectedCat?.name ?? '')
    : [];

  // ── Handlers ──
  function pickCategory(cat: ServiceCategory) {
    setSelectedCat(cat);
    setCatModalOpen(false);
    // Reset form on new category
    setJobType(''); setNationwide(false);
    setStreetAddress(''); setAddrCity(''); setAddrState(''); setAddrLat(null); setAddrLng(null);
    setCityInput(''); setStateInput(''); setCityLat(null); setCityLng(null);
    setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
    setExtraValues({}); setSelectedTags([]); setPrice('');
    setDecayEnabled(false); setDecayFloor('');
    setError(null); setDuplicateInfo(null);
  }

  function setExtra(key: string, val: string) {
    setExtraValues(prev => ({ ...prev, [key]: val }));
  }

  function toggleTag(label: string) {
    setSelectedTags(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  }

  // ── Submit ──
  async function handleSubmit() {
    setError(null);
    setDuplicateInfo(null);

    if (!selectedCat || !fieldConfig) {
      setError('Please select a service category.');
      return;
    }
    if (!jobType) {
      setError('Please select a job type.');
      return;
    }

    const isNeedsAddress = fieldConfig.needsAddress && !nationwide;
    const isAddrOptional = fieldConfig.addressOptionalJobTypes?.includes(jobType) ?? false;

    // Location validation
    if (!nationwide) {
      if (isNeedsAddress && !isAddrOptional) {
        if (!addrCity && !streetAddress) {
          setError('Please enter the service location.');
          return;
        }
        if (addrLat === null || addrLng === null) {
          setError('Please select a location from the autocomplete dropdown.');
          return;
        }
      } else if (!fieldConfig.needsAddress) {
        if (!cityInput && !stateInput) {
          setError('Please enter the city and state for this lead.');
          return;
        }
      }
    }

    // Contact validation
    if (!customerName && !customerPhone && !customerEmail) {
      setError('At least one customer contact (name, phone, or email) is required.');
      return;
    }

    // Price
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!price || isNaN(priceCents) || priceCents <= 0) {
      setError('Please enter a valid asking price.');
      return;
    }

    // Decay floor
    if (decayEnabled && decayFloor) {
      const floorCents = Math.round(parseFloat(decayFloor) * 100);
      if (floorCents >= priceCents) {
        setError('Minimum price must be less than the asking price.');
        return;
      }
    }

    // Required extra fields (skip textarea — replaced by chip selector)
    for (const field of activeFields) {
      if (field.required && field.type !== 'textarea' && !extraValues[field.key]?.trim()) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }

    // Build city/state/address for submission
    const submitCity  = nationwide ? ''
      : isNeedsAddress ? addrCity  : cityInput;
    const submitState = nationwide ? ''
      : isNeedsAddress ? addrState : stateInput;
    const submitExactAddress = isNeedsAddress && !nationwide
      ? (streetAddress ? `${streetAddress}, ${addrCity}, ${addrState}` : `${addrCity}, ${addrState}`)
      : null;
    const submitLat = isNeedsAddress && !nationwide ? addrLat : null;
    const submitLng = isNeedsAddress && !nationwide ? addrLng : null;

    setLoading(true);
    try {
      const headers = await authHeaders();

      const decayConfig = decayEnabled
        ? {
            decay_enabled:        true,
            decay_percent:        parseInt(decayPct),
            decay_interval_hours: parseInt(decayHrs),
            decay_floor_cents:    decayFloor ? Math.round(parseFloat(decayFloor) * 100) : null,
          }
        : { decay_enabled: false };

      const res = await fetch(`${BASE}/api/leads/submit`, {
        method:  'POST',
        headers,
        body: JSON.stringify({
          service_category:  selectedCat.name,
          job_type:          jobType,
          city:              submitCity,
          state:             submitState,
          nationwide,
          public_summary:    selectedTags.join(' · '),
          exact_address:     submitExactAddress,
          exact_address_lat: submitLat,
          exact_address_lng: submitLng,
          customer_name:     customerName  || null,
          customer_phone:    customerPhone || null,
          customer_email:    customerEmail || null,
          price_cents:       priceCents,
          auto_publish:      fieldConfig.autoPublish,
          metadata: {
            nationwide,
            ...decayConfig,
            ...extraValues,
          },
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        // Duplicate contact detection
        if (body.duplicate) {
          setDuplicateInfo({
            existingDate:     body.existingDate,
            existingCategory: body.existingCategory,
            existingLeadCode: body.existingLeadCode ?? null,
            hardBlock:        !!body.hard_block,
            matchedOn:        body.matchedOn ?? null,
            existingLeadId:   body.existingLeadId,
          });
          return;
        }
        throw new Error(body.error ?? 'Submission failed');
      }

      setSuccessLive(!!fieldConfig.autoPublish);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Handle request review for duplicates ──
  async function handleRequestReview() {
    if (!duplicateInfo || !selectedCat || !fieldConfig) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const priceCents = Math.round(parseFloat(price) * 100);
      const isNeedsAddress = fieldConfig.needsAddress && !nationwide;
      const submitCity  = nationwide ? '' : isNeedsAddress ? addrCity : cityInput;
      const submitState = nationwide ? '' : isNeedsAddress ? addrState : stateInput;
      const submitExactAddress = isNeedsAddress && !nationwide
        ? (streetAddress ? `${streetAddress}, ${addrCity}, ${addrState}` : `${addrCity}, ${addrState}`)
        : null;

      const res = await fetch(`${BASE}/api/leads/submit`, {
        method:  'POST',
        headers,
        body: JSON.stringify({
          service_category:  selectedCat.name,
          job_type:          jobType,
          city:              submitCity,
          state:             submitState,
          nationwide,
          public_summary:    selectedTags.join(' · '),
          exact_address:     submitExactAddress,
          exact_address_lat: isNeedsAddress && !nationwide ? addrLat : null,
          exact_address_lng: isNeedsAddress && !nationwide ? addrLng : null,
          customer_name:     customerName  || null,
          customer_phone:    customerPhone || null,
          customer_email:    customerEmail || null,
          price_cents:       priceCents,
          auto_publish:      fieldConfig.autoPublish,
          metadata:          { nationwide, ...extraValues },
          request_review:    true,
          existing_lead_id:  duplicateInfo.existingLeadId,
        }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error ?? 'Something went wrong.'); return; }
      setDuplicateInfo(null);
      Alert.alert('Submitted for Review', 'Our team will review your lead within 24 hours.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Reset form ──
  function resetForm() {
    setSuccess(false); setSelectedCat(null); setFieldConfig(null);
    setJobType(''); setNationwide(false);
    setStreetAddress(''); setAddrCity(''); setAddrState(''); setAddrLat(null); setAddrLng(null);
    setCityInput(''); setStateInput(''); setCityLat(null); setCityLng(null);
    setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
    setExtraValues({}); setSelectedTags([]); setPrice('');
    setDecayEnabled(false); setDecayFloor('');
    setError(null); setDuplicateInfo(null);
  }

  // ── Success screen ──
  if (success) {
    return (
      <ScreenShell scrollable={false}>
        <View style={styles.successWrap}>
          <Text style={{ fontSize: 64 }}>{successLive ? '⚡' : '🎉'}</Text>
          <Text style={[styles.successTitle, { color: Colors.foreground }]}>
            {successLive ? 'Lead Is Live!' : 'Lead Submitted!'}
          </Text>
          <Text style={[styles.successMsg, { color: Colors.muted }]}>
            {successLive
              ? 'Your lead has been published to the marketplace. Contractors are being notified now.'
              : 'Your lead has been received and is pending admin review. Once approved it will go live.'}
          </Text>
          <Button label="Submit Another" onPress={resetForm} fullWidth style={{ marginBottom: 8 }} />
          <Button
            label="View My Submissions"
            onPress={() => navigation.navigate('MySubmissions')}
            variant="secondary"
            fullWidth
          />
        </View>
      </ScreenShell>
    );
  }

  // ── Price calculation ──
  const priceDollars = parseFloat(price) || 0;
  const buyerPrice   = (priceDollars * 1.125).toFixed(2);

  return (
    <>
      {/* Category search modal */}
      <CategoryModal
        visible={catModalOpen}
        categories={allCategories}
        onSelect={pickCategory}
        onClose={() => setCatModalOpen(false)}
      />

      {/* Job type picker */}
      {fieldConfig && (
        <PickerModal
          visible={jtModalOpen}
          title={fieldConfig.jobTypeLabel}
          options={activeJobTypes}
          value={jobType}
          onSelect={(v) => { setJobType(v); setExtraValues({}); }}
          onClose={() => setJtModalOpen(false)}
        />
      )}

      {/* Decay percent picker */}
      <PickerModal
        visible={decayPctOpen}
        title="Price drop percentage"
        options={['5', '10', '15', '20', '25']}
        value={decayPct}
        onSelect={setDecayPct}
        onClose={() => setDecayPctOpen(false)}
      />

      {/* Decay hours picker */}
      <PickerModal
        visible={decayHrsOpen}
        title="Price drop interval"
        options={['1 hour', '2 hours', '4 hours', '6 hours', '12 hours', '24 hours']}
        value={decayHrs === '1' ? '1 hour' : `${decayHrs} hours`}
        onSelect={(v) => setDecayHrs(v.split(' ')[0])}
        onClose={() => setDecayHrsOpen(false)}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenShell title="Submit a Lead" subtitle="Fill in the customer's details">

          {/* ── Category selector ── */}
          <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
            <SectionHeader title="Service Category" />
            <TouchableOpacity
              style={[styles.catPicker, { backgroundColor: Colors.panel2 }, selectedCat && styles.catPickerActive]}
              onPress={() => setCatModalOpen(true)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                {selectedCat ? (
                  <>
                    <Text style={[styles.catPickerName, { color: Colors.foreground }]}>{selectedCat.name}</Text>
                    {selectedCat.group_name && (
                      <Text style={[styles.catPickerGroup, { color: Colors.muted }]}>{selectedCat.group_name}</Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.catPickerPlaceholder, { color: Colors.placeholder }]}>Tap to search categories…</Text>
                )}
              </View>
              <Text style={{ fontSize: 18, color: Colors.orange }}>›</Text>
            </TouchableOpacity>
            {configLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <ActivityIndicator size="small" color={Colors.orange} />
                <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>Loading category options…</Text>
              </View>
            )}
          </View>

          {/* ── Form fields — only shown once a category is selected ── */}
          {selectedCat && fieldConfig && !configLoading && (
            <>
              {/* ── Service Details ── */}
              <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
                <SectionHeader title="Service Details" />

                {/* Job Type */}
                <SelectField
                  label={fieldConfig.jobTypeLabel}
                  value={jobType}
                  options={activeJobTypes}
                  required
                  onChange={(v) => { setJobType(v); setExtraValues({}); }}
                />

                {/* Nationwide toggle — only for eligible categories */}
                {fieldConfig.nationwideEligible && (
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleLabel, { color: Colors.foreground }]}>🌐 Nationwide lead</Text>
                      <Text style={[styles.toggleSub, { color: Colors.muted }]}>Available to buyers across all US states</Text>
                    </View>
                    <Switch
                      value={nationwide}
                      onValueChange={setNationwide}
                      thumbColor={nationwide ? Colors.orange : Colors.muted}
                      trackColor={{ true: 'rgba(249,115,22,0.35)', false: Colors.border }}
                    />
                  </View>
                )}
              </View>

              {/* ── Location ── */}
              {!nationwide && (
                <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
                  <SectionHeader
                    title={fieldConfig.needsAddress ? (fieldConfig.addressLabel ?? 'Service Address') : 'Service Location'}
                    subtitle={fieldConfig.needsAddress
                      ? 'Where is the job located? Buyers see this when they purchase.'
                      : 'City and state for this lead.'}
                  />

                  {fieldConfig.needsAddress ? (
                    /* Single address autocomplete — type full address, Nominatim returns
                       street + city + state + lat/lng all at once. No more "optional" field. */
                    <AddressAutocompleteInput
                      label={(fieldConfig.addressLabel ?? 'Service address') + ' *'}
                      placeholder="Type full address, e.g. 123 Oak Ave, Boca Raton, FL…"
                      searchType="address"
                      value={
                        streetAddress
                          ? `${streetAddress}, ${addrCity}, ${addrState}`
                          : addrCity ? `${addrCity}, ${addrState}` : ''
                      }
                      onSelect={(r) => {
                        setStreetAddress(r.street ?? '');
                        setAddrCity(r.city);
                        setAddrState(r.state);
                        setAddrLat(r.lat);
                        setAddrLng(r.lng);
                      }}
                      onClear={() => {
                        setStreetAddress(''); setAddrCity(''); setAddrState('');
                        setAddrLat(null); setAddrLng(null);
                      }}
                    />
                  ) : (
                    /* City autocomplete for non-address categories */
                    <AddressAutocompleteInput
                      label="City / area *"
                      placeholder="Start typing a city…"
                      value={cityInput ? `${cityInput}, ${stateInput}` : ''}
                      onSelect={(r) => {
                        setCityInput(r.city);
                        setStateInput(r.state);
                        setCityLat(r.lat);
                        setCityLng(r.lng);
                      }}
                      onClear={() => { setCityInput(''); setStateInput(''); setCityLat(null); setCityLng(null); }}
                    />
                  )}
                </View>
              )}

              {nationwide && (
                <View style={[styles.section, styles.infoBox]}>
                  <Text style={styles.infoBoxText}>🌐 This lead will be visible to buyers across the entire United States.</Text>
                </View>
              )}

              {/* ── Customer Contact ── */}
              <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
                <SectionHeader
                  title="Customer Contact"
                  subtitle="At least one of name, phone, or email is required."
                />
                <Input
                  label="Full name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="John Smith"
                  autoCapitalize="words"
                />
                <Input
                  label="Phone"
                  value={customerPhone}
                  onChangeText={(v) => { setCustomerPhone(v); setDuplicateInfo(null); }}
                  placeholder="(555) 000-0000"
                  keyboardType="phone-pad"
                />
                <Input
                  label="Email"
                  value={customerEmail}
                  onChangeText={(v) => { setCustomerEmail(v); setDuplicateInfo(null); }}
                  placeholder="customer@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* ── Lead Details (dynamic extra fields) ── */}
              {activeFields.length > 0 && (
                <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
                  <SectionHeader title="Lead Details" />
                  {activeFields.map((field) => (
                    <ExtraFieldInput
                      key={field.key}
                      field={field}
                      value={extraValues[field.key] ?? ''}
                      onChange={(v) => setExtra(field.key, v)}
                    />
                  ))}
                </View>
              )}

              {/* ── Lead Context (chips) ── */}
              <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
                <SectionHeader
                  title="Lead Context"
                  subtitle="Optional — select any that apply."
                />
                <LeadTagChips tags={getTagsForCategory(selectedCat?.name ?? '')} selected={selectedTags} onToggle={toggleTag} />
                {selectedTags.length === 0 && (
                  <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 8 }}>
                    💡 Adding details increases your chances of the lead getting purchased
                  </Text>
                )}
              </View>

              {/* ── Pricing ── */}
              <View style={[styles.section, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange, shadowColor: Colors.glowColor }]}>
                <SectionHeader title="Pricing" />

                <Input
                  label="Your asking price ($) *"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="e.g. 75.00"
                  keyboardType="decimal-pad"
                />

                {price && priceDollars > 0 && (
                  <View style={styles.priceHint}>
                    <Text style={styles.priceHintText}>
                      💡 Buyer will pay ${buyerPrice} (includes 12.5% platform fee)
                    </Text>
                  </View>
                )}

                {/* Decay pricing toggle */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: Colors.foreground }]}>Auto-reduce price if unsold</Text>
                    <Text style={[styles.toggleSub, { color: Colors.muted }]}>Price drops automatically at set intervals</Text>
                  </View>
                  <Switch
                    value={decayEnabled}
                    onValueChange={setDecayEnabled}
                    thumbColor={decayEnabled ? Colors.orange : Colors.muted}
                    trackColor={{ true: 'rgba(249,115,22,0.35)', false: Colors.border }}
                  />
                </View>

                {decayEnabled && (
                  <View style={[styles.decayBox, { backgroundColor: Colors.panel2 }]}>
                    <View style={styles.decayRow}>
                      <Text style={[styles.decayLabel, { color: Colors.muted }]}>Reduce by</Text>
                      <TouchableOpacity
                        style={[styles.decayBtn, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange }]}
                        onPress={() => setDecayPctOpen(true)}
                      >
                        <Text style={[styles.decayBtnText, { color: Colors.orange }]}>{decayPct}%</Text>
                      </TouchableOpacity>
                      <Text style={[styles.decayLabel, { color: Colors.muted }]}>every</Text>
                      <TouchableOpacity
                        style={[styles.decayBtn, { backgroundColor: Colors.panel, borderColor: Colors.borderOrange }]}
                        onPress={() => setDecayHrsOpen(true)}
                      >
                        <Text style={[styles.decayBtnText, { color: Colors.orange }]}>
                          {decayHrs === '1' ? '1 hour' : `${decayHrs} hours`}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Input
                      label="Minimum price (floor) — optional"
                      value={decayFloor}
                      onChangeText={setDecayFloor}
                      placeholder="e.g. 20.00"
                      keyboardType="decimal-pad"
                    />

                    {priceDollars > 0 && (
                      <Text style={styles.decayPreview}>
                        Example: ${priceDollars.toFixed(2)} → drops {decayPct}% after {decayHrs}h → ${(priceDollars * (1 - parseInt(decayPct) / 100)).toFixed(2)}
                        {decayFloor && parseFloat(decayFloor) > 0 ? `, down to $${parseFloat(decayFloor).toFixed(2)} minimum` : ''}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* ── Duplicate warning ── */}
              {duplicateInfo && (
                <View style={styles.dupBox}>
                  <Text style={styles.dupTitle}>⚠️ Duplicate Contact Detected</Text>
                  <Text style={styles.dupMsg}>
                    {duplicateInfo.matchedOn === 'phone' ? 'The phone number' : duplicateInfo.matchedOn === 'email' ? 'The email address' : 'A contact'} you entered was already submitted on <Text style={{ fontWeight: '700', color: Colors.foreground }}>{duplicateInfo.existingDate}</Text> under <Text style={{ fontWeight: '700', color: Colors.foreground }}>{duplicateInfo.existingCategory}</Text>
                    {duplicateInfo.existingLeadCode ? ` (#${duplicateInfo.existingLeadCode})` : ''}.
                  </Text>
                  {duplicateInfo.hardBlock ? (
                    <Text style={[styles.dupMsg, { color: Colors.danger, marginTop: 4 }]}>
                      You submitted this contact previously. Duplicate submissions from the same provider are not permitted.
                    </Text>
                  ) : (
                    <Text style={styles.dupMsg}>
                      If this is a new, genuine service request you can request manual review.
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                    {!duplicateInfo.hardBlock && (
                      <Button
                        label="Request Review"
                        onPress={handleRequestReview}
                        loading={loading}
                        style={{ flex: 1 }}
                      />
                    )}
                    <Button
                      label={`Change ${duplicateInfo.matchedOn === 'phone' ? 'Phone' : 'Email'}`}
                      onPress={() => {
                        if (duplicateInfo.matchedOn === 'phone') setCustomerPhone('');
                        else if (duplicateInfo.matchedOn === 'email') setCustomerEmail('');
                        else { setCustomerPhone(''); setCustomerEmail(''); }
                        setDuplicateInfo(null);
                      }}
                      variant="secondary"
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}

              {/* ── Error ── */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* ── Submit ── */}
              <Button
                label={fieldConfig.autoPublish ? 'Submit & Publish Now ⚡' : 'Submit for Review'}
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                style={{ marginBottom: Spacing.xl }}
              />
            </>
          )}

          {/* Placeholder when no category selected yet */}
          {!selectedCat && !configLoading && (
            <View style={styles.noCatHint}>
              <Text style={{ fontSize: 48, textAlign: 'center' }}>📋</Text>
              <Text style={[styles.noCatText, { color: Colors.muted }]}>Select a category above to start filling in the lead details.</Text>
            </View>
          )}

        </ScreenShell>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.xl,
    borderWidth:     2,
    borderColor:     Colors.borderOrange,
    padding:         Spacing.md,
    gap:             Spacing.md,
    marginBottom:    Spacing.sm + 4,
    ...Shadow.card,
  },
  catPicker: {
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       'rgba(59,130,246,0.28)',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    flexDirection:     'row',
    alignItems:        'center',
  },
  catPickerActive:       { borderColor: 'rgba(249,115,22,0.55)' },
  catPickerName:         { fontSize: FontSize.base, fontWeight: '600', color: Colors.foreground },
  catPickerGroup:        { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
  catPickerPlaceholder:  { fontSize: FontSize.base, color: Colors.placeholder },
  toggleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.foreground },
  toggleSub:   { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
  infoBox: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor:     'rgba(59,130,246,0.35)',
  },
  infoBoxText:   { fontSize: FontSize.sm, color: Colors.accent },
  textarea: {
    backgroundColor:   Colors.panel2,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       'rgba(59,130,246,0.28)',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    fontSize:          FontSize.base,
    color:             Colors.foreground,
    minHeight:         100,
  },
  charCount: {
    fontSize:  FontSize.xs,
    color:     Colors.muted,
    textAlign: 'right',
    marginTop: -8,
  },
  priceHint: {
    backgroundColor: 'rgba(129,140,248,0.08)',
    borderRadius:    Radius.md,
    padding:         Spacing.sm,
    borderWidth:     1,
    borderColor:     'rgba(129,140,248,0.22)',
    marginTop:       -8,
  },
  priceHintText: { fontSize: FontSize.xs, color: Colors.accent, lineHeight: 16 },
  decayBox: {
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    gap:             Spacing.md,
  },
  decayRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  decayLabel:  { fontSize: FontSize.sm, color: Colors.muted },
  decayBtn: {
    backgroundColor: Colors.panel,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.borderOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  decayBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.orange },
  decayPreview: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 16 },
  dupBox: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     'rgba(251,191,36,0.35)',
    padding:         Spacing.md,
    gap:             Spacing.sm,
    marginBottom:    Spacing.sm + 4,
  },
  dupTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.warn },
  dupMsg:   { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 16 },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     'rgba(248,113,113,0.35)',
    padding:         Spacing.md,
    marginBottom:    Spacing.sm + 4,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.danger },
  successWrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.md,
    padding:         Spacing.xl,
  },
  successTitle: {
    fontSize:   FontSize.xl,
    fontWeight: '700',
    color:      Colors.foreground,
    textAlign:  'center',
  },
  successMsg: {
    fontSize:  FontSize.sm,
    color:     Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  noCatHint: {
    alignItems:   'center',
    paddingTop:   Spacing.xl,
    gap:          Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  noCatText: {
    fontSize:  FontSize.sm,
    color:     Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
