import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { ms, scaleY, SCREEN_WIDTH } from '../utils/scale';
import { typePlayer } from '../utils/audio';

const PADDING = ms(10);

interface KeyboardProps {
  onPress: (val: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  mode: 'qwerty' | 'anagram';
  targetWord: string;
}

export const Keyboard: React.FC<KeyboardProps> = ({ onPress, onClear, onSubmit, mode, targetWord }) => {
  const { settings } = useStore();

  const [anagramKeys, setAnagramKeys] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'anagram') {
      const letters = targetWord.toUpperCase().split('');
      const uniqueLetters = Array.from(new Set(letters));

      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const decoys = alphabet.filter(l => !uniqueLetters.includes(l));

      // Shuffle decoys
      const shuffledDecoys = decoys.sort(() => 0.5 - Math.random());
      const selectedDecoys = shuffledDecoys.slice(0, 4);

      const allKeys = [...uniqueLetters, ...selectedDecoys].sort(() => 0.5 - Math.random());
      setAnagramKeys(allKeys);
    }
  }, [mode, targetWord]);

  const handlePress = (char: string) => {
    onPress(char);
    if (settings.sfx && typePlayer) {
      try {
        typePlayer.seekTo(0);
        typePlayer.play();
      } catch (e) { }
    }
  };

  const handleClear = () => {
    onClear();
    if (settings.sfx && typePlayer) {
      try {
        typePlayer.seekTo(0);
        typePlayer.play();
      } catch (e) { }
    }
  };

  const renderKey = (char: string, flex?: number, isAction?: boolean, isOk?: boolean) => (
    <TouchableOpacity
      key={char}
      style={[
        styles.keyButton,
        flex ? { flex } : undefined,
        isAction ? styles.actionButton : undefined,
        isOk ? styles.okButton : undefined,
      ]}
      onPressIn={() => {
        if (char === 'DEL') handleClear();
        else if (char === 'OK') onSubmit();
        else handlePress(char);
      }}
      activeOpacity={0.6}
      delayPressIn={0}
    >
      <Text style={[
        styles.keyText,
        isAction ? styles.actionText : undefined,
        isOk ? styles.okText : undefined,
        (isAction || isOk) && { fontSize: ms(18) }
      ]}>{char}</Text>
    </TouchableOpacity>
  );

  if (mode === 'anagram') {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          {anagramKeys.slice(0, 5).map(k => renderKey(k, 1))}
        </View>
        <View style={styles.row}>
          {anagramKeys.slice(5).map(k => renderKey(k, 1))}
        </View>
        <View style={styles.actionRow}>
          {renderKey('DEL', 1.5, true)}
          {renderKey('OK', 1.5, false, true)}
        </View>
      </View>
    );
  }

  // QWERTY Mode
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(k => renderKey(k, 1))}
      </View>
      <View style={styles.row}>
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(k => renderKey(k, 1))}
      </View>
      <View style={styles.row}>
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(k => renderKey(k, 1))}
      </View>
      <View style={styles.actionRow}>
        {renderKey('DEL', 1.5, true)}
        {renderKey('OK', 1.5, false, true)}
      </View>
    </View>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const KEYBOARD_HEIGHT = SCREEN_HEIGHT * 0.30;
const ROW_HEIGHT = KEYBOARD_HEIGHT / 3;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: KEYBOARD_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  anagramRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  actionRow: {
    height: scaleY(60),
    flexDirection: 'row',
    width: '100%',
  },
  keyButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    minWidth: ms(35),
  },
  actionButton: {
    backgroundColor: COLORS.background,
  },
  okButton: {
    backgroundColor: COLORS.black,
  },
  keyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
    fontSize: ms(24),
  },
  actionText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },
  okText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  }
});
