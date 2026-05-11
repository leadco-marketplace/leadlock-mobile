import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, FontSize, Shadow } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[fullWidth && { width: '100%' }, isDisabled && { opacity: 0.45 }]}
      >
        <LinearGradient
          colors={['#f97316', '#fbbf24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, Shadow.orange, fullWidth && { width: '100%' }, style]}
        >
          {loading
            ? <ActivityIndicator color={Colors.bg} size="small" />
            : <Text style={[styles.primaryText, textStyle]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'accent') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[fullWidth && { width: '100%' }, isDisabled && { opacity: 0.45 }]}
      >
        <LinearGradient
          colors={['#818cf8', '#22d3ee']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, fullWidth && { width: '100%' }, style]}
        >
          {loading
            ? <ActivityIndicator color={Colors.bg} size="small" />
            : <Text style={[styles.primaryText, textStyle]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = {
    secondary: { backgroundColor: Colors.panel2, borderColor: Colors.borderOrange, borderWidth: 1 },
    danger:    { backgroundColor: 'rgba(248,113,113,0.10)', borderColor: 'rgba(248,113,113,0.40)', borderWidth: 1 },
    ghost:     { backgroundColor: 'transparent' },
  }[variant];

  const variantTextColor = {
    secondary: Colors.foreground,
    danger:    Colors.danger,
    ghost:     Colors.textSecondary,
  }[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        variantStyle,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.45 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variantTextColor} size="small" />
        : <Text style={[styles.text, { color: variantTextColor }, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius:    Radius.lg,
    gap:             6,
  },
  text: {
    fontSize:   FontSize.sm,
    fontWeight: '600',
  },
  primaryText: {
    fontSize:   FontSize.sm,
    fontWeight: '700',
    color:      Colors.bg,
  },
});
