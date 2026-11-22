import React, { useState, useEffect } from 'react';
import { View, Text, Image, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { ScreenshotData } from '../types';

interface Props {
  visible: boolean;
  screenshot: ScreenshotData | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  isLive: boolean;
  onToggleLive: () => void;
}

export function ScreenshotViewer({
  visible,
  screenshot,
  loading,
  onClose,
  onRefresh,
  isLive,
  onToggleLive,
}: Props) {
  const windowWidth = Dimensions.get('window').width;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Desktop View</Text>
            {screenshot?.timestamp && (
              <Text style={styles.subtitle}>
                {new Date(screenshot.timestamp).toLocaleTimeString()}
                {screenshot.width > 0 ? ` • ${screenshot.width}x${screenshot.height}` : ''}
              </Text>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, isLive && styles.liveBtnActive]}
              onPress={onToggleLive}
            >
              <Ionicons name="radio" size={18} color={isLive ? Colors.success : Colors.textMuted} />
              <Text style={[styles.actionBtnText, isLive && { color: Colors.success }]}>
                {isLive ? 'LIVE' : 'Live'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onRefresh} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Ionicons name="refresh" size={20} color={Colors.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Screenshot Viewport */}
        <View style={styles.viewport}>
          {screenshot?.image ? (
            <Image
              source={{ uri: `data:image/png;base64,${screenshot.image}` }}
              style={[styles.image, { width: windowWidth - 32 }]}
              resizeMode="contain"
            />
          ) : loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>Capturing screenshot...</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="image-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No screenshot captured</Text>
            </View>
          )}
        </View>

        {/* Bottom Control Bar */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.captureBtn} onPress={onRefresh}>
            <Ionicons name="camera" size={22} color={Colors.text} />
            <Text style={styles.captureBtnText}>Capture Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 48,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    gap: 4,
  },
  liveBtnActive: {
    borderColor: Colors.success,
    borderWidth: 1,
  },
  actionBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  viewport: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  image: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  captureBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  captureBtnText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
