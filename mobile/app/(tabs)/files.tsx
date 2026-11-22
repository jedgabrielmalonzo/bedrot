import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { FileItem } from '../../src/types';
import { wsService } from '../../src/services/websocket';

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FilesScreen() {
  const { sendCommand, isConnected } = useWebSocket();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameModal, setRenameModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  useEffect(() => {
    if (!isConnected) return;
    
    const unsub = wsService.onMessage((type: string, payload: any) => {
      if (type === 'file.listResponse') {
        setFiles(payload.items || []);
        setCurrentPath(payload.path);
        setParentPath(payload.parentPath || null);
        setLoading(false);
      } else if (type === 'file.downloadResponse') {
        Alert.alert('File Downloaded', `Received "${payload.fileName}" (${formatSize(payload.size)})`);
      }
    });

    setLoading(true);
    sendCommand('file.list', { path: '~' });

    return unsub;
  }, [isConnected, sendCommand]);

  const navigate = (path: string) => {
    setLoading(true);
    sendCommand('file.list', { path });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      sendCommand('file.createFolder', { path: currentPath, name: newFolderName.trim() });
      setNewFolderModal(false);
      setNewFolderName('');
      setTimeout(() => navigate(currentPath), 500);
    }
  };

  const handleRename = () => {
    if (selectedItem && renameNewName.trim()) {
      sendCommand('file.rename', { path: selectedItem.path, newName: renameNewName.trim() });
      setRenameModal(false);
      setRenameNewName('');
      setTimeout(() => navigate(currentPath), 500);
    }
  };

  const handleDelete = (item: FileItem) => {
    Alert.alert('Delete', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          sendCommand('file.delete', { path: item.path });
          setTimeout(() => navigate(currentPath), 500);
        },
      },
    ]);
  };

  const handleDownload = (item: FileItem) => {
    sendCommand('file.download', { path: item.path });
  };

  const handleItemLongPress = (item: FileItem) => {
    setSelectedItem(item);
    Alert.alert(
      item.name,
      item.isDirectory ? 'Folder actions' : `Size: ${formatSize(item.size)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(!item.isDirectory
          ? [{ text: 'Download', onPress: () => handleDownload(item) }]
          : []),
        {
          text: 'Rename',
          onPress: () => {
            setRenameNewName(item.name);
            setRenameModal(true);
          },
        },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
      ]
    );
  };

  const pathParts = currentPath.split(/\\|\//).filter(Boolean);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Files & Storage</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setNewFolderModal(true)}>
              <Ionicons name="folder-outline" size={20} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigate(currentPath || '~')}>
              <Ionicons name="refresh" size={20} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Location Chips */}
        <ScrollView horizontal style={styles.chipsScroll} showsHorizontalScrollIndicator={false}>
          {['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos'].map(loc => (
            <TouchableOpacity
              key={loc}
              style={styles.chip}
              onPress={() => navigate(loc)}
            >
              <Text style={styles.chipText}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Breadcrumb Path */}
        <View style={styles.breadcrumbBar}>
          {parentPath && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigate(parentPath)}>
              <Ionicons name="arrow-back" size={16} color={Colors.accent} />
            </TouchableOpacity>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.breadcrumb}>
              {pathParts.slice(-3).map((part, i) => (
                <View key={i} style={styles.breadcrumbPart}>
                  <Text style={styles.breadcrumbText}>{part}</Text>
                  {i < Math.min(pathParts.length, 3) - 1 && <Text style={styles.breadcrumbSep}>/</Text>}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* File List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <ScrollView style={styles.fileList} contentContainerStyle={styles.fileListContent}>
            {files.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.fileItem}
                onPress={() => item.isDirectory ? navigate(item.path) : handleItemLongPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.isDirectory ? 'folder' : 'document-text'}
                  size={26}
                  color={item.isDirectory ? Colors.warning : Colors.textSecondary}
                />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.fileMeta}>
                    {item.isDirectory ? 'Folder' : formatSize(item.size)}
                    {item.modified ? ` • ${new Date(item.modified).toLocaleDateString()}` : ''}
                  </Text>
                </View>
                {item.isDirectory ? (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                ) : (
                  <TouchableOpacity onPress={() => handleDownload(item)}>
                    <Ionicons name="cloud-download-outline" size={20} color={Colors.accent} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}

            {files.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.empty}>This folder is empty</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* New Folder Modal */}
        <Modal visible={newFolderModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Folder</Text>
              <TextInput
                style={styles.modalInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Folder name"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setNewFolderModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleCreateFolder}>
                  <Text style={styles.modalConfirmText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Rename Modal */}
        <Modal visible={renameModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Rename Item</Text>
              <TextInput
                style={styles.modalInput}
                value={renameNewName}
                onChangeText={setRenameNewName}
                placeholder="New name"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleRename}>
                  <Text style={styles.modalConfirmText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipsScroll: { maxHeight: 36, marginBottom: 2 },
  chip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500' },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  backBtn: { padding: 4 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbPart: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbText: { color: Colors.accent, fontSize: FontSize.xs },
  breadcrumbSep: { color: Colors.textMuted, marginHorizontal: 4, fontSize: FontSize.xs },
  fileList: { flex: 1 },
  fileListContent: { paddingBottom: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  fileInfo: { flex: 1 },
  fileName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  fileMeta: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xxl, gap: Spacing.sm },
  empty: { color: Colors.textMuted, fontSize: FontSize.md },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  modalTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  modalInput: {
    backgroundColor: Colors.card,
    color: Colors.text,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.md,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  modalCancel: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modalCancelText: { color: Colors.textMuted, fontSize: FontSize.md },
  modalConfirm: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
});
