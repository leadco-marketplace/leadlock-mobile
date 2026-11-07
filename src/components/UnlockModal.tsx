import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Colors, FontSize, Spacing, Radius } from '@/theme';
import { Lead } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

interface UnlockModalProps {
  lead: Lead | null;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Compact "time on the board" (45m / 3h / 2d). */
function onBoard(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 3_600_000) return `${Math.max(1, Math.floor(ms / 60_000))}m`;
  const h = Math.floor(ms / 3_600_000);
  return h < 48 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

export function UnlockModal({ lead, visible, onCancel, onConfirm }: UnlockModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [ackedStale, setAckedStale] = useState(false);
  const { mode } = useTheme(); // re-render on theme change
  // Vehicle tag: brand orange in dark mode, near-black in light modes.
  const vehicleColor = mode === 'dark' ? '#f97316' : '#111827';

  if (!lead) return null;

  const sellerPrice    = lead.price_cents;
  const platformFee    = Math.round(sellerPrice * 0.15);
  const total          = sellerPrice + platformFee;
  // First-lead-free: this buyer hasn't used their free lead and this lead is
  // fully covered — show FREE (struck price) so they aren't scared off.
  const isFree         = !!lead.first_lead_free;
  // Stale EMERGENCY lead (lockout/tow/active leak past its short window): the
  // buyer must confirm before unlocking — these are the main "dead lead" refunds.
  const requiresAck    = !!lead.requires_ack;
  const ageLabel       = onBoard(lead.published_at ?? lead.created_at);

  function handleConfirm() {
    if (!accepted || (requiresAck && !ackedStale)) return;
    setAccepted(false);
    setAckedStale(false);
    onConfirm();
  }

  function handleCancel() {
    setAccepted(false);
    setAckedStale(false);
    onCancel();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: Colors.panel }]}>
          {/* ── Header ─────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: Colors.foreground }]}>Unlock This Lead</Text>
              <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                {lead.service_category}
                {lead.job_type ? ` · ${lead.job_type}` : ''}
              </Text>
              {lead.vehicle ? (
                <Text style={[styles.subtitle, { color: vehicleColor, fontWeight: '700' }]} numberOfLines={1}>
                  🚗 {lead.vehicle}
                </Text>
              ) : null}
              {lead.provider_badge ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    marginTop: 6,
                    backgroundColor: lead.provider_badge.color + '24',
                    borderColor: lead.provider_badge.color,
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingVertical: 3,
                    paddingHorizontal: 9,
                  }}
                >
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: lead.provider_badge.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 9, letterSpacing: 0.5, color: lead.provider_badge.color, fontWeight: '700', marginRight: 5 }}>SOURCE</Text>
                  <Text style={{ fontSize: 12, color: Colors.foreground }}>{lead.provider_badge.codename}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeText, { color: Colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Price breakdown ─────────────────────────────── */}
          <View style={[styles.priceBox, { backgroundColor: Colors.panel2, borderColor: Colors.border }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>Location</Text>
              <Text style={[styles.priceValue, { color: Colors.foreground }]}>
                {lead.nationwide
                  ? 'Nationwide'
                  : ([lead.city, lead.state].filter(Boolean).join(', ') +
                     (lead.zip_code ? ` ${lead.zip_code}` : '')) || 'Location pending'}
              </Text>
            </View>

            {ageLabel ? (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>On the board</Text>
                <Text style={[styles.priceValue, { color: requiresAck ? '#f59e0b' : Colors.foreground }]}>{ageLabel}</Text>
              </View>
            ) : null}

            <View style={[styles.divider, { backgroundColor: Colors.border }]} />

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>Lead price</Text>
              <Text style={[styles.priceValue, { color: Colors.foreground }]}>{fmt(sellerPrice)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>Platform fee (15%)</Text>
              <Text style={[styles.priceValue, { color: Colors.textSecondary }]}>{fmt(platformFee)}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: Colors.border }]} />

            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: Colors.foreground }]}>Total</Text>
              {isFree ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.totalValue, { color: Colors.muted, textDecorationLine: 'line-through', fontSize: FontSize.base }]}>{fmt(total)}</Text>
                  <Text style={[styles.totalValue, { color: '#34d399' }]}>FREE</Text>
                </View>
              ) : (
                <Text style={styles.totalValue}>{fmt(total)}</Text>
              )}
            </View>
            {isFree && (
              <Text style={{ fontSize: FontSize.xs, color: '#34d399', textAlign: 'right', marginTop: 4, fontWeight: '600' }}>
                🎁 Your first lead is on us
              </Text>
            )}
          </View>

          {/* ── Privacy notice ──────────────────────────────── */}
          <View style={styles.noticeBox}>
            <Text style={[styles.noticeText, { color: Colors.textSecondary }]}>
              ℹ️{'  '}Job description and call details are revealed after payment. All calls go through the Nabbit platform for privacy and verification.
            </Text>
          </View>

          {/* ── Stale-emergency acknowledge gate (speed bump, not a block) ── */}
          {requiresAck && (
            <View style={styles.staleBox}>
              <Text style={styles.staleWarn}>
                ⏳ This emergency lead has been on the board for {ageLabel}. For lockouts, tows,
                and active leaks the customer has often already been helped and may no longer need service.
              </Text>
              <TouchableOpacity style={styles.checkRow} onPress={() => setAckedStale(!ackedStale)} activeOpacity={0.7}>
                <View style={[styles.checkbox, { borderColor: '#f59e0b' }, ackedStale && { backgroundColor: '#f59e0b' }]}>
                  {ackedStale && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkLabel, { color: '#fcd9a0' }]}>
                  I understand this lead may already be handled and still want to unlock it.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Terms checkbox ──────────────────────────────── */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              { borderColor: Colors.accent },
              accepted && { backgroundColor: Colors.accent },
            ]}>
              {accepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkLabel, { color: Colors.textSecondary }]}>
              I accept the buyer purchase terms: non-refundable except via platform credit for verifiable lead-quality issues reported through the dispute flow.
            </Text>
          </TouchableOpacity>

          {/* ── Buttons ─────────────────────────────────────── */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: Colors.border }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payBtn, (!accepted || (requiresAck && !ackedStale)) && styles.payBtnDisabled]}
              onPress={handleConfirm}
              disabled={!accepted || (requiresAck && !ackedStale)}
              activeOpacity={0.85}
            >
              <Text style={styles.payBtnText}>{isFree ? 'Get it FREE' : `Pay ${fmt(total)}`}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    textTransform: 'capitalize',
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  closeBtn: {
    paddingTop: 2,
  },
  closeText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Price box
  priceBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  priceValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#818cf8',   // accent blue — same as web
    fontVariant: ['tabular-nums'],
  },

  // Privacy notice
  noticeBox: {
    backgroundColor: 'rgba(129,140,248,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.25)',
    padding: Spacing.sm + 4,
  },
  noticeText: {
    fontSize: FontSize.xs,
    lineHeight: 17,
  },

  // Stale-emergency acknowledge box
  staleBox: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.45)',
    padding: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  staleWarn: {
    fontSize: FontSize.xs,
    lineHeight: 17,
    color: '#fcd9a0',
  },

  // Terms checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  checkLabel: {
    fontSize: FontSize.xs,
    lineHeight: 17,
    flex: 1,
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  payBtn: {
    flex: 2,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.lg,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
  },
  payBtnDisabled: {
    backgroundColor: 'rgba(59,130,246,0.35)',
  },
  payBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
});
