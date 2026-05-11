import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Colors, Radius, FontSize, Spacing } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          {...props}
          secureTextEntry={secureToggle ? !showPassword : props.secureTextEntry}
          style={[styles.input, style]}
          placeholderTextColor={Colors.placeholder}
          selectionColor={Colors.orange}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize:   FontSize.xs,
    color:      Colors.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.panel2,
    borderRadius:    Radius.md,
    borderWidth:     1,
    paddingHorizontal: Spacing.md,
  },
  inputNormal: {
    borderColor: 'rgba(249,115,22,0.25)',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    flex:          1,
    paddingVertical: Spacing.sm + 4,
    fontSize:      FontSize.base,
    color:         Colors.foreground,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: FontSize.xs,
    color:    Colors.danger,
    marginTop: 2,
  },
});
