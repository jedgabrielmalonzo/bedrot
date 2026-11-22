import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface Props {
  volume: number;
  muted: boolean;
  onVolumeChange: (level: number) => void;
  onMuteToggle: () => void;
}

export function VolumeSlider({ volume, muted, onVolumeChange, onMuteToggle }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMuteToggle}>
        <Ionicons
          name={muted ? 'volume-mute' : volume > 50 ? 'volume-high' : 'volume-medium'}
          size={28}
          color={muted ? Colors.danger : Colors.accent}
        />
      </TouchableOpacity>
      
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${muted ? 0 : volume}%` }]} />
      </View>
      
      <Text style={styles.volumeText}>{muted ? 'Muted' : `${volume}%`}</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.volBtn} onPress={() => onVolumeChange(Math.max(0, volume - 5))}>
          <Ionicons name="remove" size={20} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.volBtn} onPress={() => onVolumeChange(Math.min(100, volume + 5))}>
          <Ionicons name="add" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  volumeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    width: 44,
    textAlign: 'center',
  },
  buttons: { flexDirection: 'row', gap: 4 },
  volBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
