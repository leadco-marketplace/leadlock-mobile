import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ViewStyle, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('screen');
const FONT_BLACK = Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy' : 'sans-serif-condensed';
const SPACING = 20; // pixels between diagonal lines
// Enough lines to cover screen diagonally even on largest devices
const LINE_COUNT = Math.ceil((SW + SH) / SPACING) + 4;

/**
 * Diagonal line pattern rendered with pure View elements.
 * Works on all platforms without react-native-svg or image tiling.
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
 * LeadCo logo as pure View elements — no image file, no black background.
 * Renders the 3×3 grid of coloured rounded squares directly.
 * Transparent background — shows whatever is behind it.
 */
function LogoIcon({ size = 40 }: { size?: number }) {
  const gap = Math.round(size * 0.08);
  const cell = Math.round((size - gap * 2) / 3);
  const br = Math.round(cell * 0.28);
  const ROWS = [
    ['#152244', '#5078D8', '#8898DC'],
    ['#7050CC', '#D87828', '#D87828'],
    ['#5C38B8', '#D87828', '#A84C18'],
  ];
  return (
    <View>
      {ROWS.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', marginBottom: r < 2 ? gap : 0 }}>
          {row.map((color, c) => (
            <View
              key={c}
              style={{
                width: cell,
                height: cell,
                backgroundColor: color,
                borderRadius: br,
                marginRight: c < 2 ? gap : 0,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Option B — Neon Pulse title.
 *
 * React Native only supports one textShadow per Text element, so we stack
 * four Text layers at increasing radii to fake CSS's multi-value text-shadow.
 * All layers are white — glow colour comes from textShadowColor, which is
 * read at render time so it follows the active theme (orange in light, blue
 * in dark / inner-light).
 */
function GlowTitle({ text, fontFamily }: { text: string; fontFamily: string }) {
  const gc = Colors.glowColor;
  const base = {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily,
    textShadowOffset: { width: 0, height: 0 },
    color: '#ffffff' as const,
  };
  return (
    <View>
      <Text style={[base, { position: 'absolute', textShadowColor: gc, textShadowRadius: 28, opacity: 0.45 }]} numberOfLines={1}>{text}</Text>
      <Text style={[base, { position: 'absolute', textShadowColor: gc, textShadowRadius: 14, opacity: 0.65 }]} numberOfLines={1}>{text}</Text>
      <Text style={[base, { position: 'absolute', textShadowColor: gc, textShadowRadius: 6,  opacity: 0.85 }]} numberOfLines={1}>{text}</Text>
      {/* Core — sets layout height */}
      <Text style={[base, { textShadowColor: gc, textShadowRadius: 3 }]} numberOfLines={1}>{text}</Text>
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
  useTheme();

  const content = (
    <View style={[styles.content, contentStyle]}>
      {(title || subtitle || rightElement) && (
        <View>
          {/*
           * Simple left-aligned row: [logo] [title] — both anchored to
           * the left edge. Logo sits immediately to the left of the title
           * text. rightElement floats to the far right if present.
           */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <LogoIcon size={36} />
              {title && <GlowTitle text={title} fontFamily={FONT_BLACK} />}
            </View>
            {rightElement && <View>{rightElement}</View>}
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
  // Logo + title together on the left
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 6,
    // color applied inline
  },
});
