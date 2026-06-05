import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';

interface QuitGameModalProps {
  visible: boolean;
  onCancel: () => void;
  onQuit: () => void;
}

export const QuitGameModal: React.FC<QuitGameModalProps> = ({ visible, onCancel, onQuit }) => {
  const { settings } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 40) }]}>

          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.label}>LEAVE MATCH</Text>
              <Text style={styles.title}>QUIT GAME?</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.body}>
            <Text style={styles.bodyText}>
              Are you sure you want to quit? Your current streak will be lost.
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.quitButton} onPress={() => { playClick(settings.sfx); onQuit(); }}>
              <Text style={styles.quitText}>QUIT GAME</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => { playClick(settings.sfx); onCancel(); }}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    backgroundColor: COLORS.white,
    width: '100%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 48,
    lineHeight: 48,
    color: COLORS.black,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  bodyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  quitButton: {
    backgroundColor: COLORS.darkRed,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  quitText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textSecondary,
  },
});
