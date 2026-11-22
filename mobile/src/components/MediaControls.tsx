import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../constants/theme';

interface Props {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isPlaying?: boolean;
}

export function MediaControls({ onPlayPause, onNext, onPrevious, isPlaying }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.sideButton} onPress={onPrevious}>
        <Ionicons name="play-skip-back" size={28} color={Colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color={Colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.sideButton} onPress={onNext}>
        <Ionicons name="play-skip-forward" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
