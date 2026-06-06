import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';

interface Props {
  visible: boolean;
  onClose: () => void;
  errorMsg?: string;
}

export const AdNotReadyModal: React.FC<Props> = ({ visible, onClose, errorMsg }) => {
  const { settings } = useStore();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>AD NOT READY</Text>
          <Text style={styles.body}>
            Please wait a moment for the ad to load and try again.
          </Text>
          {errorMsg ? (
            <Text style={styles.errorText}>Details: {errorMsg}</Text>
          ) : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                playClick(settings.sfx);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>OKAY</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.black,
    padding: 25,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    marginBottom: 15,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    marginBottom: 10,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.red,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.background,
  },
});
