import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Input }   from '@/components/Input';
import { Button }  from '@/components/Button';
import { ScreenShell } from '@/components/ScreenShell';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  'Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Solar',
  'Landscaping', 'Painting', 'Flooring', 'Windows & Doors',
  'Pest Control', 'Air Duct Cleaning', 'Auto Body Repair',
  'Moving Services', 'Home Security', 'Pool Service',
  'Garage Door', 'Junk Removal', 'Kitchen Remodeling',
];

function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={styles.label}>Service Category</Text>
      <View
        style={[styles.pickerBox, value && { borderColor: Colors.orange }]}
      >
        <Text
          style={{ color: value ? Colors.foreground : Colors.placeholder, fontSize: FontSize.base }}
          onPress={() => setOpen(!open)}
        >
          {value || 'Select a category…'}
        </Text>
      </View>
      {open && (
        <View style={styles.dropdown}>
          {CATEGORIES.map((c) => (
            <Text
              key={c}
              style={[styles.dropdownItem, value === c && styles.dropdownItemActive]}
              onPress={() => { onChange(c); setOpen(false); }}
            >
              {c}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export function SubmitLeadScreen({ navigation }: any) {
  const [category,  setCategory]  = useState('');
  const [jobType,   setJobType]   = useState('');
  const [city,      setCity]      = useState('');
  const [state,     setState]     = useState('');
  const [summary,   setSummary]   = useState('');
  const [price,     setPrice]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);

  async function handleSubmit() {
    if (!category || !jobType || !city || !state || !price) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!priceCents || priceCents < 100) {
      Alert.alert('Invalid price', 'Price must be at least $1.00');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${Constants.expoConfig?.extra?.apiBaseUrl}/api/leads/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            service_category: category,
            job_type: jobType,
            city,
            state,
            public_summary: summary,
            price_cents: priceCents,
            nationwide: false,
          }),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Submission failed');
      setSuccess(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ScreenShell scrollable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl }}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground, textAlign: 'center' }}>
            Lead Submitted!
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center' }}>
            Your lead is under review and will go live soon.
          </Text>
          <Button
            label="Submit Another"
            onPress={() => {
              setSuccess(false);
              setCategory(''); setJobType(''); setCity('');
              setState(''); setSummary(''); setPrice('');
            }}
            fullWidth
          />
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenShell title="Submit a Lead" subtitle="Fill in the customer's details below">
        <View style={styles.form}>
          <CategoryPicker value={category} onChange={setCategory} />

          <Input
            label="Job Type / Description"
            value={jobType}
            onChangeText={setJobType}
            placeholder="e.g. Full roof replacement"
          />

          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Input label="City" value={city} onChangeText={setCity} placeholder="Miami" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="State" value={state} onChangeText={setState} placeholder="FL" autoCapitalize="characters" maxLength={2} />
            </View>
          </View>

          <Input
            label="Public Summary (shown to buyers)"
            value={summary}
            onChangeText={setSummary}
            placeholder="Brief description of the customer's project…"
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />

          <Input
            label="Your Asking Price ($)"
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 75.00"
            keyboardType="decimal-pad"
          />

          <View style={styles.priceHint}>
            <Text style={styles.priceHintText}>
              💡 Buyer will pay {price ? `$${(Math.round(parseFloat(price || '0') * 100) * 1.125 / 100).toFixed(2)}` : '—'} (includes 12.5% platform fee)
            </Text>
          </View>

          <Button
            label="Submit Lead"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
        </View>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form:       { gap: Spacing.md },
  row:        { flexDirection: 'row', gap: Spacing.sm },
  label:      { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  pickerBox: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  dropdown: {
    backgroundColor: Colors.panel2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderOrange,
    marginTop: 4,
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: { color: Colors.orange, backgroundColor: 'rgba(249,115,22,0.08)' },
  priceHint: {
    backgroundColor: 'rgba(129,140,248,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.22)',
  },
  priceHintText: { fontSize: FontSize.xs, color: Colors.accent, lineHeight: 16 },
});
