import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Vibration } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../constants/theme';

interface Props {
  onLeftClick: () => void;
  onRightClick: () => void;
}

export function MouseButtons({ onLeftClick, onRightClick }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.leftButton]}
        onPress={() => { onLeftClick(); Vibration.vibrate(15); }}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Left Click</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <TouchableOpacity
        style={[styles.button, styles.rightButton]}
        onPress={() => { onRightClick(); Vibration.vibrate(15); }}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Right Click</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    gap: 2,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftButton: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  rightButton: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  divider: {
    width: 2,
    backgroundColor: Colors.background,
  },
  buttonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
});
