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
    content: 'Welcome to Speed Spell!\n\nThis game is designed to test and expand your vocabulary and spelling skills.',
  },
  {
    title: 'THE DICTATION',
    content: 'A voice will read out a word.\n\nListen carefully, then type the correct spelling before the timer runs out!',
  },
  {
    title: 'LIFELINES',
    content: 'Stuck on a tricky word?\n\nYou have 3 lifelines per game: Definition, Origin, and Sentence. Tap them for hints!',
  },
  {
    title: 'THE MODES',
    content: 'TRAIN mode is for endless practice.\n\nCOMPETE mode is a ranked challenge that builds your Linguistic ELO.',
  }
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ visible }) => {
  const { settings, completeTutorial } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const [speakerOp, setSpeakerOp] = useState(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 1 && visible) {
      interval = setInterval(() => {
        setSpeakerOp(prev => prev === 1 ? 0.3 : 1);
      }, 500);
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
              <Text style={{ ...TYPOGRAPHY.h1, fontSize: ms(24), color: COLORS.train }}>SPELL</Text>
            </View>
            <View style={styles.floatingSymbol1}><Text style={styles.symbolText}>A</Text></View>
            <View style={styles.floatingSymbol2}><Text style={styles.symbolText}>Z</Text></View>
            <View style={styles.floatingSymbol3}><Text style={styles.symbolText}>Q</Text></View>
          </View>
        );
      case 1:
        return (
          <View style={styles.visualBox}>
            <View style={styles.gameScreenMock}>
              <Text style={[styles.flashMockText, { opacity: speakerOp }]}>🔊</Text>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.visualBox}>
            <View style={styles.lifelineRow}>
              <View style={styles.lifelineMock}><Text style={styles.lifelineIcon}>📖</Text></View>
              <View style={styles.lifelineMock}><Text style={styles.lifelineIcon}>🌍</Text></View>
              <View style={styles.lifelineMock}><Text style={styles.lifelineIcon}>💬</Text></View>
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
    borderRadius: 60,
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
    fontSize: ms(50),
  },

  // Slide 3 Visuals
  lifelineRow: {
    flexDirection: 'row',
    gap: ms(15),
  },
  lifelineMock: {
    width: ms(60),
    height: ms(50),
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  lifelineIcon: {
    fontSize: ms(24),
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
