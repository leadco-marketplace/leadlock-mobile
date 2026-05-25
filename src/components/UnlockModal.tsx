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

export function UnlockModal({ lead, visible, onCancel, onConfirm }: UnlockModalProps) {
  const [accepted, setAccepted] = useState(false);
  useTheme(); // re-render on theme change

  if (!lead) return null;

  const sellerPrice    = lead.price_cents;
  const platformFee    = Math.round(sellerPrice * 0.10);
  const processingFee  = Math.round(sellerPrice * 0.025);
  const total          = sellerPrice + platformFee + processingFee;

  function handleConfirm() {
    if (!accepted) return;
    setAccepted(false);
    onConfirm();
  }

  function handleCancel() {
    setAccepted(false);
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
                {lead.nationwide ? 'Nationwide' : `${lead.city}, ${lead.state}`}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: Colors.border }]} />

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>Lead price</Text>
              <Text style={[styles.priceValue, { color: Colors.foreground }]}>{fmt(sellerPrice)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>Platform fee (10%)</Text>
              <Text style={[styles.priceValue, { color: Colors.textSecondary }]}>{fmt(platformFee)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: Colors.textSecondary }]}>Processing fee (2.5%)</Text>
              <Text style={[styles.priceValue, { color: Colors.textSecondary }]}>{fmt(processingFee)}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: Colors.border }]} />

            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: Colors.foreground }]}>Total</Text>
              <Text style={styles.totalValue}>{fmt(total)}</Text>
            </View>
          </View>

          {/* ── Privacy notice ──────────────────────────────── */}
          <View style={styles.noticeBox}>
            <Text style={[styles.noticeText, { color: Colors.textSecondary }]}>
              ℹ️{'  '}Job description and call details are revealed after payment. All calls go through the LeadCo platform for privacy and verification.
            </Text>
          </View>

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
              style={[styles.payBtn, !accepted && styles.payBtnDisabled]}
              onPress={handleConfirm}
              disabled={!accepted}
              activeOpacity={0.85}
            >
              <Text style={styles.payBtnText}>Pay {fmt(total)}</Text>
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
    backgroundColor: '#f97316',
    alignItems: 'center',
  },
  payBtnDisabled: {
    backgroundColor: 'rgba(249,115,22,0.35)',
  },
  payBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
});
