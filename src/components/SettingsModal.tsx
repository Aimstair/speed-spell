import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, TouchableWithoutFeedback, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { playClick } from '../utils/audio';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { settings, updateSettings } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 40) }]}>
              <View style={styles.header}>
                <Text style={styles.title}>SETTINGS</Text>
                <TouchableOpacity onPress={() => { playClick(settings.sfx); onClose(); }}>
                  <Text style={styles.doneText}>DONE</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Sound Effects</Text>
                <Switch
                  value={settings.sfx}
                  onValueChange={(v) => updateSettings({ sfx: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.train }}
                  thumbColor={COLORS.white}
                />
              </View>
              <View style={styles.separator} />

              <View style={styles.row}>
                <View>
                  <Text style={styles.label}>Screen Shake</Text>
                  <Text style={styles.subtext}>Vibrates on wrong answer</Text>
                </View>
                <Switch
                  value={settings.screenShake}
                  onValueChange={(v) => updateSettings({ screenShake: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.train }}
                  thumbColor={COLORS.white}
                />
              </View>
              <View style={styles.separator} />

              <View style={styles.backgroundSection}>
                <Text style={styles.subtitle}>GAMEPLAY BACKGROUND</Text>
                <View style={styles.swatches}>
                  {COLORS.swatches.map((swatch, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.swatch,
                        { backgroundColor: swatch },
                        settings.backgroundHex === swatch && styles.swatchSelected
                      ]}
                      onPress={() => { playClick(settings.sfx); updateSettings({ backgroundHex: swatch }); }}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  playClick(settings.sfx);
                  Linking.openURL('https://aimstair.app/speedmath/privacy');
                }}
              >
                <Text style={styles.label}>Privacy Policy</Text>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.button,
  },
  doneText: {
    ...TYPOGRAPHY.button,
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  subtext: {
    ...TYPOGRAPHY.subtitle,
    marginTop: 4,
    textTransform: 'none',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  backgroundSection: {
    padding: 20,
  },
  subtitle: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: 15,
  },
  swatches: {
    flexDirection: 'row',
    gap: 15,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: COLORS.black,
  },
  arrow: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
  }
});
