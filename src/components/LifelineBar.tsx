import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { ms, scaleY } from '../utils/scale';

export type LifelineType = 'define' | 'origin' | 'sentence';

interface LifelineBarProps {
  lifelinesRemaining: number;
  usedThisWord: Set<LifelineType>;
  onUse: (type: LifelineType) => void;
  onAdRefill: () => void;
  showAdPrompt: boolean;
  disabled: boolean;
}

const LIFELINE_CONFIG: { type: LifelineType; icon: string; label: string }[] = [
  { type: 'define', icon: '📖', label: 'Define' },
  { type: 'origin', icon: '🌍', label: 'Origin' },
  { type: 'sentence', icon: '💬', label: 'Sentence' },
];

export const LifelineBar: React.FC<LifelineBarProps> = ({
  lifelinesRemaining,
  usedThisWord,
  onUse,
  onAdRefill,
  showAdPrompt,
  disabled,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {LIFELINE_CONFIG.map(({ type, icon, label }) => {
          const usedThisRound = usedThisWord.has(type);
          const noLifelines = lifelinesRemaining <= 0;
          const isDisabled = disabled || usedThisRound || noLifelines;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.lifelineButton,
                usedThisRound && styles.lifelineUsed,
                noLifelines && !usedThisRound && styles.lifelineEmpty,
              ]}
              onPress={() => onUse(type)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.lifelineIcon,
                isDisabled && styles.lifelineIconDisabled,
              ]}>
                {usedThisRound ? '🔒' : icon}
              </Text>
              <Text style={[
                styles.lifelineLabel,
                isDisabled && styles.lifelineLabelDisabled,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.counterContainer}>
          <Text style={styles.counterNumber}>{lifelinesRemaining}</Text>
          <Text style={styles.counterLabel}>left</Text>
        </View>
      </View>

      {showAdPrompt && lifelinesRemaining <= 2 && (
        <TouchableOpacity style={styles.adPrompt} onPress={onAdRefill} activeOpacity={0.8}>
          <Text style={styles.adPromptText}>▶ Watch ad for +1 lifeline</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(16),
    paddingVertical: scaleY(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
  },
  lifelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: ms(10),
    paddingVertical: scaleY(6),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: ms(4),
  },
  lifelineUsed: {
    backgroundColor: '#E8E8E8',
    borderColor: '#CCCCCC',
    opacity: 0.6,
  },
  lifelineEmpty: {
    backgroundColor: '#F0F0F0',
    borderColor: '#DDDDDD',
    opacity: 0.4,
  },
  lifelineIcon: {
    fontSize: ms(14),
  },
  lifelineIconDisabled: {
    opacity: 0.5,
  },
  lifelineLabel: {
    ...TYPOGRAPHY.button,
    fontSize: ms(11),
    color: COLORS.black,
  },
  lifelineLabelDisabled: {
    color: COLORS.textSecondary,
  },
  counterContainer: {
    alignItems: 'center',
    marginLeft: ms(4),
    minWidth: ms(28),
  },
  counterNumber: {
    ...TYPOGRAPHY.h3,
    fontSize: ms(18),
    color: COLORS.black,
    lineHeight: ms(20),
  },
  counterLabel: {
    ...TYPOGRAPHY.subtitle,
    fontSize: ms(9),
    color: COLORS.textSecondary,
    lineHeight: ms(11),
    letterSpacing: 0,
    textTransform: 'none',
  },
  adPrompt: {
    marginTop: scaleY(6),
    alignSelf: 'center',
    backgroundColor: COLORS.train,
    paddingHorizontal: ms(14),
    paddingVertical: scaleY(5),
    borderRadius: ms(6),
  },
  adPromptText: {
    ...TYPOGRAPHY.button,
    fontSize: ms(11),
    color: COLORS.black,
  },
});
