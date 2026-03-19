import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { T } from '../../constants/theme';

export function Card({ style, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props} />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: T.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(28,25,23,0.03)',
  }
});
