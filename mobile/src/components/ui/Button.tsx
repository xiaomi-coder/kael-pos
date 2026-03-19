import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { T } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export function Button({ title, variant = 'primary', isLoading, style, ...props }: ButtonProps) {
  const bgColors = {
    primary: T.accent,
    secondary: T.cardAlt,
    danger: T.red,
    ghost: 'transparent'
  };
  const textColors = {
    primary: '#FFF',
    secondary: T.text,
    danger: '#FFF',
    ghost: T.accent
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColors[variant] },
        variant === 'secondary' && styles.secondaryBorder,
        style
      ]}
      disabled={isLoading || props.disabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.text, { color: textColors[variant] }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: T.border,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  }
});
