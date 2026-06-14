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
  // which lets the inline backgroundColor below pick up the updated Colors.bg.
  useTheme();

  const content = (
    <View style={[styles.content, contentStyle]}>
      {(title || subtitle) && (
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            {title    && <Text style={[styles.title,    { color: Colors.foreground, fontFamily: FONT_BLACK }]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>{subtitle}</Text>}
          </View>
          {rightElement}
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
  headerRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
  },
  title: {
    fontSize:   FontSize.xxl,
    fontWeight: '700',
    // color applied inline so it updates with theme
  },
  subtitle: {
    fontSize:  FontSize.sm,
    marginTop: 3,
    // color applied inline so it updates with theme
  },
});
