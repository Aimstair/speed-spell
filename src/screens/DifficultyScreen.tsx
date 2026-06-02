import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';

type Props = NativeStackScreenProps<RootStackParamList, 'Difficulty'>;

const DIFFICULTIES = [
  { id: 'Beginner', num: '01', details: '5 numbers    1 digit    1.0s flicker' },
  { id: 'Intermediate', num: '02', details: '8 numbers    2-3 digits    0.8s flicker' },
  { id: 'Expert', num: '03', details: '10 numbers    3-4 digits    0.6s flicker' },
  { id: 'Olympiad', num: '04', details: '10 numbers    4-5 digits    0.4s flicker' },
];

export const DifficultyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode } = route.params;
  const isTrain = mode === 'train';
  const { settings } = useStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { playClick(settings.sfx); navigation.goBack(); }}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DIFFICULTY</Text>
        <View style={[styles.modeBadge, { backgroundColor: isTrain ? COLORS.train : COLORS.compete }]}>
          <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>SELECT</Text>
        <Text style={styles.title}>LEVEL.</Text>
        <Text style={styles.subtitle}>
          {isTrain ? 'Train mode — practice freely, no score impact.' : 'Ranked mode — ELO changes applied.'}
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {DIFFICULTIES.map((diff) => (
          <TouchableOpacity
            key={diff.id}
            style={styles.card}
            onPress={() => { playClick(settings.sfx); navigation.navigate('Game', { mode, difficulty: diff.id }); }}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardNum}>{diff.num}</Text>
            </View>
            <View style={styles.cardCenter}>
              <Text style={styles.cardTitle}>{diff.id.toUpperCase()}</Text>
              <Text style={styles.cardDetails}>{diff.details}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    paddingRight: 20,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.black,
    paddingBottom: 10,
  },
  headerTitle: {
    ...TYPOGRAPHY.subtitle,
    flex: 1,
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  modeText: {
    ...TYPOGRAPHY.button,
    fontSize: 12,
    color: COLORS.black,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: 70,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 15,
  },
  list: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardLeft: {
    width: 40,
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
    width: 40,
    alignItems: 'flex-end',
  },
  arrow: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  }
});
