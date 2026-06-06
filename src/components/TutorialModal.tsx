import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { playClick } from '../utils/audio';
import { ms, scaleY } from '../utils/scale';

const ARROW_RIGHT = '\u2192';

interface TutorialModalProps {
  visible: boolean;
}

const STEPS = [
  {
    title: 'WELCOME',
    content: 'Welcome to Speed Math!\n\nThis game is designed to test and improve your mental calculation speed.',
  },
  {
    title: 'THE MECHANICS',
    content: 'Numbers will flash on the screen quickly.\n\nAdd them up in your head as fast as you can!',
  },
  {
    title: 'THE INPUT',
    content: 'When the flashing stops, a question mark will appear.\n\nType the total sum using the numpad and hit ENT.',
  },
  {
    title: 'THE MODES',
    content: 'TRAIN mode is for endless practice.\n\nCOMPETE mode is a 1-round daily challenge that builds your Cognitive Score (ELO).',
  }
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ visible }) => {
  const { settings, completeTutorial } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  // For Step 1 (Flashing numbers)
  const [flashNum, setFlashNum] = useState<number | string>(14);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 1 && visible) {
      const numbers = [14, 5, 21, 8, '?'];
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % numbers.length;
        setFlashNum(numbers[idx]);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [step, visible]);

  const handleNext = () => {
    playClick(settings.sfx);
    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  if (!visible) return null;

  const currentStep = STEPS[step];

  const renderVisual = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.visualBox}>
            <View style={styles.logoBox}>
              <Text style={{ ...TYPOGRAPHY.h1, fontSize: ms(24) }}>SPEED</Text>
              <Text style={{ ...TYPOGRAPHY.h1, fontSize: ms(24) }}>MATH</Text>
            </View>
            <View style={styles.floatingSymbol1}><Text style={styles.symbolText}>+</Text></View>
            <View style={styles.floatingSymbol2}><Text style={styles.symbolText}>=</Text></View>
            <View style={styles.floatingSymbol3}><Text style={styles.symbolText}>x</Text></View>
          </View>
        );
      case 1:
        return (
          <View style={styles.visualBox}>
            <View style={styles.gameScreenMock}>
              <Text style={styles.flashMockText}>{flashNum}</Text>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.visualBox}>
            <View style={styles.numpadMock}>
              <Text style={styles.inputMockText}>40</Text>
              <View style={styles.numpadGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'ENT'].map((k, i) => (
                  <View key={i} style={[styles.numpadKey, k === 'ENT' && { backgroundColor: COLORS.black }]}>
                    <Text style={[styles.numpadKeyText, k === 'ENT' && { color: COLORS.white }]}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.visualBox}>
            <View style={styles.modesContainer}>
              <View style={[styles.modeMock, { backgroundColor: COLORS.train }]}>
                <Text style={styles.modeMockTitle}>TRAIN</Text>
                <Text style={styles.modeMockSub}>Practice Mode</Text>
              </View>
              <View style={[styles.modeMock, { backgroundColor: COLORS.compete }]}>
                <Text style={styles.modeMockTitle}>COMPETE</Text>
                <Text style={styles.modeMockSub}>Ranked Mode</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, ms(20)) }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{currentStep.title}</Text>
              <Text style={styles.stepCounter}>{step + 1} / {STEPS.length}</Text>
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.visualArea}>
                {renderVisual()}
              </View>
              <Text style={styles.contentText}>{currentStep.content}</Text>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {step === STEPS.length - 1 ? "LET'S GO" : "NEXT"}
              </Text>
              {step < STEPS.length - 1 && (
                <Text style={styles.arrow}>{ARROW_RIGHT}</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: ms(20),
  },
  container: {
    backgroundColor: COLORS.white,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.button,
  },
  stepCounter: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
  },
  contentContainer: {
    padding: ms(20),
    minHeight: scaleY(300),
  },
  visualArea: {
    height: scaleY(180),
    width: '100%',
    marginBottom: ms(20),
    borderRadius: 16,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visualBox: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(10),
  },
  contentText: {
    ...TYPOGRAPHY.body,
    fontSize: ms(16, 0.3),
    lineHeight: ms(24, 0.3),
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.train,
  },
  nextButtonText: {
    ...TYPOGRAPHY.button,
  },
  arrow: {
    ...TYPOGRAPHY.button,
    marginLeft: ms(10),
  },
  
  // Slide 1 Visuals
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSymbol1: { position: 'absolute', top: 20, left: 30, opacity: 0.2 },
  floatingSymbol2: { position: 'absolute', bottom: 30, right: 40, opacity: 0.2 },
  floatingSymbol3: { position: 'absolute', top: 40, right: 30, opacity: 0.2 },
  symbolText: { ...TYPOGRAPHY.h1, fontSize: ms(40) },

  // Slide 2 Visuals
  gameScreenMock: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  flashMockText: {
    ...TYPOGRAPHY.h1,
    fontSize: ms(40),
  },

  // Slide 3 Visuals
  numpadMock: {
    width: 140,
    alignItems: 'center',
  },
  inputMockText: {
    ...TYPOGRAPHY.h2,
    fontSize: ms(24),
    marginBottom: ms(10),
    letterSpacing: 2,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(4),
    justifyContent: 'center',
  },
  numpadKey: {
    width: ms(35),
    height: ms(30),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  numpadKeyText: {
    ...TYPOGRAPHY.button,
    fontSize: ms(12),
  },

  // Slide 4 Visuals
  modesContainer: {
    width: '100%',
    gap: ms(10),
    paddingHorizontal: ms(20),
  },
  modeMock: {
    width: '100%',
    padding: ms(15),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  modeMockTitle: {
    ...TYPOGRAPHY.button,
    fontSize: ms(16),
  },
  modeMockSub: {
    ...TYPOGRAPHY.subtitle,
    marginTop: ms(4),
  }
});
