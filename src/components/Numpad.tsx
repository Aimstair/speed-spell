import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { ms, scaleY, SCREEN_WIDTH } from '../utils/scale';
import { typePlayer } from '../utils/audio';

const PADDING = ms(20);
const BUTTON_SIZE = (SCREEN_WIDTH - PADDING * 2 - ms(20)) / 3;

interface NumpadProps {
  onPress: (val: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

export const Numpad: React.FC<NumpadProps> = ({ onPress, onClear, onSubmit }) => {
  const { settings } = useStore();

  const handlePress = (num: string) => {
    onPress(num);
    if (settings.sfx && typePlayer) {
      setTimeout(() => {
        try {
          typePlayer.seekTo(0);
          typePlayer.play();
        } catch (e) {}
      }, 0);
    }
  };

  const handleClear = () => {
    onClear();
    if (settings.sfx && typePlayer) {
      setTimeout(() => {
        try {
          typePlayer.seekTo(0);
          typePlayer.play();
        } catch (e) {}
      }, 0);
    }
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((num) => (
            <TouchableOpacity key={num} style={styles.button} onPress={() => handlePress(num)}>
              <Text style={styles.buttonText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleClear}>
          <Text style={styles.actionText}>CLR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handlePress('0')}>
          <Text style={styles.buttonText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={onSubmit}>
          <Text style={styles.submitText}>ENT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: PADDING,
    gap: scaleY(8),
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: scaleY(16),
    paddingBottom: scaleY(30),
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE * 0.65,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  actionButton: {
    backgroundColor: COLORS.black,
  },
  submitButton: {
    backgroundColor: COLORS.train,
  },
  buttonText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  actionText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  submitText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  }
});
