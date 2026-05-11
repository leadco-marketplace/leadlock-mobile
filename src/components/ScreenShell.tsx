import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '@/theme';

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
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
