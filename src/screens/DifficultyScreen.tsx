import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';
import { CustomAlertModal, CustomAlertButton } from '../components/CustomAlertModal';
import { ms, scaleY, isSmallDevice } from '../utils/scale';

type Props = NativeStackScreenProps<RootStackParamList, 'Difficulty'>;

const ARROW = '\u2192';
const BACK_ARROW = '\u2190';

const DIFFICULTIES = [
  { id: 'Beginner', num: '01', details: '3-5 letters · Anagram Mode · 30s timer' },
  { id: 'Intermediate', num: '02', details: '6-8 letters · QWERTY Mode · 25s timer' },
  { id: 'Expert', num: '03', details: '9-12 letters · Complex rules · 20s timer' },
  { id: 'Olympiad', num: '04', details: 'Obscure words · Definitions · 15s timer' },
];

export const DifficultyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode } = route.params;
  const isTrain = mode === 'train';
  const { settings, consumeCompeteTry } = useStore();
  const [alertVisible, setAlertVisible] = React.useState(false);

  const showAlert = () => {
    setAlertVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { playClick(settings.sfx); navigation.goBack(); }} style={{ paddingRight: ms(20) }}>
          <Text style={styles.backButton}>{BACK_ARROW}</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>SPEED SPELL</Text>
        <View style={[styles.modeBadge, { backgroundColor: isTrain ? COLORS.train : COLORS.compete }]}>
          <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>SELECT</Text>
        <Text style={styles.title}>LEVEL.</Text>
        <Text style={styles.subtitle}>
          {isTrain ? 'Train mode \u2014 practice freely, no score impact.' : 'Ranked mode \u2014 ELO changes applied.'}
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {DIFFICULTIES.map((diff) => (
          <TouchableOpacity
            key={diff.id}
            style={styles.card}
            onPress={() => {
              playClick(settings.sfx);
              if (mode === 'compete') {
                const success = consumeCompeteTry();
                if (!success) {
                  showAlert();
                  return;
                }
              }
              navigation.navigate('Game', { mode, difficulty: diff.id });
            }}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardNum}>{diff.num}</Text>
            </View>
            <View style={styles.cardCenter}>
              <Text style={styles.cardTitle}>{diff.id.toUpperCase()}</Text>
              <Text style={styles.cardDetails}>{diff.details}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.arrow}>{ARROW}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CustomAlertModal
        visible={alertVisible}
        title="Out of tries"
        message="You have used all 5 compete tries for today. Come back tomorrow!"
        buttons={[{ text: "OK", onPress: () => setAlertVisible(false) }]}
        onDismiss={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingTop: scaleY(15),
    paddingBottom: scaleY(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: ms(24),
    color: COLORS.black,
  },
  headerText: {
    ...TYPOGRAPHY.subtitle,
  },
  modeBadge: {
    paddingHorizontal: ms(12),
    paddingVertical: scaleY(4),
  },
  modeText: {
    ...TYPOGRAPHY.button,
    fontSize: ms(12, 0.3),
    color: COLORS.black,
  },
  titleContainer: {
    paddingHorizontal: ms(20),
    paddingVertical: isSmallDevice ? scaleY(25) : scaleY(40),
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: ms(70, 0.3),
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: scaleY(15),
  },
  list: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleY(25),
    paddingHorizontal: ms(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardLeft: {
    width: ms(40),
  },
  cardNum: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
  },
  cardCenter: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
    marginBottom: 5,
  },
  cardDetails: {
    ...TYPOGRAPHY.subtitle,
    textTransform: 'none',
    letterSpacing: 0,
  },
  cardRight: {
    width: ms(40),
    alignItems: 'flex-end',
  },
  arrow: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  }
});
