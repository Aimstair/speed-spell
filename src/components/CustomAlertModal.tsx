import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  onDismiss?: () => void;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({ visible, title, message, buttons, onDismiss }) => {
  const { settings } = useStore();
  const insets = useSafeAreaInsets();

  const handlePress = (callback?: () => void) => {
    playClick(settings.sfx);
    if (callback) callback();
  };

  const defaultButtons: CustomAlertButton[] = [
    { text: 'OK', onPress: () => { if (onDismiss) onDismiss(); } }
  ];

  const activeButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.buttonContainer}>
            {activeButtons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel ? styles.buttonCancel : isDestructive ? styles.buttonDestructive : styles.buttonDefault,
                    index > 0 && { borderLeftWidth: 1, borderColor: COLORS.border }
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel ? styles.textCancel : isDestructive ? styles.textDestructive : styles.textDefault
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDefault: {
    backgroundColor: COLORS.white,
  },
  buttonCancel: {
    backgroundColor: COLORS.background,
  },
  buttonDestructive: {
    backgroundColor: COLORS.red,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
  },
  textDefault: {
    color: COLORS.black,
  },
  textCancel: {
    color: COLORS.textSecondary,
  },
  textDestructive: {
    color: COLORS.white,
  },
});
