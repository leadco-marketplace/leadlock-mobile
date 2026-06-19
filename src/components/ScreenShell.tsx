import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, RefreshControl, ViewStyle, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('screen');
const FONT_BLACK = Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy' : 'sans-serif-condensed';
const LOGO = require('../../assets/icon.png');
const SPACING = 20; // pixels between diagonal lines
// Enough lines to cover screen diagonally even on largest devices
const LINE_COUNT = Math.ceil((SW + SH) / SPACING) + 4;

/**
 * Diagonal line pattern rendered with pure View elements.
 * Works on all platforms without react-native-svg or image tiling.
 * Each line is a 1px-wide View rotated 45°, extending long enough
 * to span the full screen at an angle.
 */
function DiagonalPattern() {
  const lineLength = Math.sqrt(SW * SW + SH * SH) + 100;
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 1,
            height: lineLength,
            backgroundColor: Colors.patternLine,
            top: -(lineLength / 2),
            left: i * SPACING - SH,
            transform: [{ rotate: '45deg' }],
            transformOrigin: 'top center',
          }}
        />
      ))}
    </View>
  );
}

/**
 * Option B — Neon Pulse title.
 *
 * React Native only supports one textShadow per Text element, so we stack
 * four Text layers at increasing radii to fake CSS's multi-value text-shadow.
 * The bottom layers are wide + faint (outer glow ring), the top layer is
 * tight + bright (the crisp core). All layers are white — glow colour comes
 * entirely from textShadowColor, which is set at render-time so it follows
 * the active theme (orange in light, blue in dark / inner-light).
 */
function GlowTitle({ text, fontFamily }: { text: string; fontFamily: string }) {
  const gc = Colors.glowColor; // theme-aware — read at render, not in StyleSheet
  const base = {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily,
    textShadowOffset: { width: 0, height: 0 },
    color: '#ffffff' as const,
  };
  return (
    <View>
      {/* Outermost ring — widest blur, most transparent */}
      <Text
        style={[base, { position: 'absolute', textShadowColor: gc, textShadowRadius: 28, opacity: 0.45 }]}
        numberOfLines={1}
      >
        {text}
      </Text>
      {/* Second ring */}
      <Text
        style={[base, { position: 'absolute', textShadowColor: gc, textShadowRadius: 14, opacity: 0.65 }]}
        numberOfLines={1}
      >
        {text}
      </Text>
      {/* Third ring — inner halo */}
      <Text
        style={[base, { position: 'absolute', textShadowColor: gc, textShadowRadius: 6, opacity: 0.85 }]}
        numberOfLines={1}
      >
        {text}
      </Text>
      {/* Core — sets layout height; tight glow for crispness */}
      <Text
        style={[base, { textShadowColor: gc, textShadowRadius: 3 }]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

interface ScreenShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export function ScreenShell({
  title,
  subtitle,
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  contentStyle,
  rightElement,
}: ScreenShellProps) {
  // Calling useTheme() ensures this component re-renders when theme changes,
  // which lets the inline Colors.* and GlowTitle's Colors.glowColor pick up
  // the updated values.
  useTheme();

  const content = (
    <View style={[styles.content, contentStyle]}>
      {(title || subtitle || rightElement) && (
        <View style={styles.headerContainer}>
          {/* Logo + title row — centered as a unit (Layout 2) */}
          <View style={styles.titleRow}>
            {title && <Image source={LOGO} style={styles.logoImg} />}
            {title && <GlowTitle text={title} fontFamily={FONT_BLACK} />}
            {rightElement && <View style={{ marginLeft: 8 }}>{rightElement}</View>}
          </View>
          {subtitle && (
            <Text style={[styles.subtitle, { color: Colors.headerSubText }]}>{subtitle}</Text>
          )}
        </View>
      )}
      {children}
    </View>
  );

  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.bg }]} edges={['top']}>
        <DiagonalPattern />
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.bg }]} edges={['top']}>
      <DiagonalPattern />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
            : undefined
        }
      >
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  // Header wrapper — centers everything horizontally
  headerContainer: {
    alignItems: 'center',
  },
  // Logo + neon title sit side by side, the unit is centered by headerContainer
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 40,
    height: 40,
    borderRadius: 9,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 6,
    textAlign: 'center',
    // color applied inline
  },
});
