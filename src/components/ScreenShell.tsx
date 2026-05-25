import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ViewStyle, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '@/theme';

// Diagonal line pattern (base64 PNG, 16×16 tile matching web app design)
const PATTERN_B64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAS0lEQVR42mP4WSzGC8IM5AKYAeQYgqKHVEOwqifWELzqCBlClCW4FJHkTXTFZAU0cgyRHdVU0UyR86kSgFSJQqokIqokYwz1lOZGAIu0XYVVo0ceAAAAAElFTkSuQmCC';

function DiagonalPattern() {
  return (
    <Image
      source={{ uri: `data:image/png;base64,${PATTERN_B64}` }}
      style={StyleSheet.absoluteFill}
      resizeMode="repeat"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — pointerEvents on Image is valid in RN
      pointerEvents="none"
    />
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
  const content = (
    <View style={[styles.content, contentStyle]}>
      {(title || subtitle) && (
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            {title    && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightElement}
        </View>
      )}
      {children}
    </View>
  );

  if (!scrollable) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DiagonalPattern />
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
    fontSize:   FontSize.xl,
    fontWeight: '700',
    color:      Colors.foreground,
  },
  subtitle: {
    fontSize:  FontSize.sm,
    color:     Colors.textSecondary,
    marginTop: 3,
  },
});
