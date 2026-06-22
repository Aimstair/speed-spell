import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';

interface BlitzOvertimeModalProps {
  visible: boolean;
  onWatchAd: () => void;
  onDecline: () => void;
}

export const BlitzOvertimeModal: React.FC<BlitzOvertimeModalProps> = ({ visible, onWatchAd, onDecline }) => {
  const { settings } = useStore();
  const [timeLeft, setTimeLeft] = useState(10);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      setTimeLeft(10);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (visible && timeLeft <= 0) {
      onDecline();
    }
  }, [visible, timeLeft, onDecline]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 40) }]}>

          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.label}>TIME</Text>
              <Text style={styles.title}>UP.</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.label}>EXPIRES IN</Text>
              <Text style={styles.timer}>{timeLeft}s</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.body}>
            <Text style={styles.bodyText}>
              Watch a short ad to add 15 seconds to the clock!
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.watchButton} onPress={() => { playClick(settings.sfx); onWatchAd(); }}>
              <Text style={styles.watchText}>WATCH AD FOR +15 SECONDS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineButton} onPress={() => { playClick(settings.sfx); onDecline(); }}>
              <Text style={styles.declineText}>END GAME</Text>
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
  headerRight: {
    alignItems: 'flex-end',
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
  timer: {
    // fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
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
  watchButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  watchText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  declineButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  declineText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textSecondary,
  },
});
