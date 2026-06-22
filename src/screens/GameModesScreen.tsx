import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { playClick } from '../utils/audio';
import { ms, scaleY, isSmallDevice } from '../utils/scale';
import { getLocalTodayString, getDailyWords } from '../utils/daily';
import { CustomAlertModal, CustomAlertButton } from '../components/CustomAlertModal';

const BACK_ARROW = '\u2190';
const ARROW = '\u2192';

type Props = NativeStackScreenProps<RootStackParamList, 'GameModes'>;

export const GameModesScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, dailyChallenge, weakWords } = useStore();

  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertTitle, setAlertTitle] = React.useState('');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertButtons, setAlertButtons] = React.useState<CustomAlertButton[]>([]);

  const showAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: "OK", onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { playClick(settings.sfx); navigation.goBack(); }} style={{ paddingRight: ms(20) }}>
          <Text style={styles.backButton}>{BACK_ARROW}</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>SPEED SPELL</Text>
        <View style={{ width: ms(24) }} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>GAME</Text>
        <Text style={styles.title}>MODES.</Text>
        <View style={styles.subtitleRow}>
          <View style={styles.line} />
          <Text style={styles.subtitle}>CHOOSE YOUR MODE</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Daily Challenge */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => {
            playClick(settings.sfx);
            if (dailyChallenge.lastDate !== getLocalTodayString()) {
              navigation.navigate('Game', { mode: 'daily', difficulty: 'Intermediate', dailyWords: getDailyWords() });
            } else {
              showAlert("Completed!", "You've already completed today's challenge. Come back tomorrow!");
            }
          }}
        >
          <Text style={styles.modeLabel}>01 — DAILY</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>
              {dailyChallenge.lastDate === getLocalTodayString() ? 'COMPLETED' : 'CHALLENGE'}
            </Text>
            <Text style={styles.arrow}>{ARROW}</Text>
          </View>
          <Text style={styles.modeSub}>Streak: {dailyChallenge.streak} 🔥</Text>
        </TouchableOpacity>

        {/* Graveyard */}
        <TouchableOpacity
          style={[styles.modeCard, { opacity: weakWords.length === 0 ? 0.5 : 1 }]}
          onPress={() => {
            playClick(settings.sfx);
            if (weakWords.length > 0) {
              navigation.navigate('Game', { mode: 'review', difficulty: 'Intermediate' });
            } else {
              showAlert("Graveyard Empty", "You have no weak words to review right now. Great job!");
            }
          }}
        >
          <Text style={styles.modeLabel}>02 — THE GRAVEYARD</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>REVIEW</Text>
            <Text style={styles.arrow}>{ARROW}</Text>
          </View>
          <Text style={styles.modeSub}>{weakWords.length} words need practice</Text>
        </TouchableOpacity>

        {/* Multiplayer */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => { playClick(settings.sfx); navigation.navigate('Game', { mode: 'multiplayer', difficulty: 'Any' }); }}
        >
          <Text style={styles.modeLabel}>03 — PASS & PLAY</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>MULTIPLAYER</Text>
            <Text style={styles.arrow}>{ARROW}</Text>
          </View>
          <Text style={styles.modeSub}>Challenge a friend on this device</Text>
        </TouchableOpacity>

        {/* Blitz */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => { playClick(settings.sfx); navigation.navigate('Game', { mode: 'blitz', difficulty: 'Any' }); }}
        >
          <Text style={styles.modeLabel}>04 — TIME ATTACK</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>BLITZ MODE</Text>
            <Text style={styles.arrow}>{ARROW}</Text>
          </View>
          <Text style={styles.modeSub}>60 seconds. As many as possible.</Text>
        </TouchableOpacity>

        {/* Custom Lists */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => { playClick(settings.sfx); navigation.navigate('CustomLists'); }}
        >
          <Text style={styles.modeLabel}>05 — CREATE & PLAY</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>CUSTOM LISTS</Text>
            <Text style={styles.arrow}>{ARROW}</Text>
          </View>
          <Text style={styles.modeSub}>Make your own spelling lists</Text>
        </TouchableOpacity>

        {/* Themed Packs */}
        <View style={styles.themeSection}>
          <Text style={styles.modeLabel}>06 — THEMED PACKS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: scaleY(5) }}>
            {['SAT Prep', 'Medical', 'Science'].map(theme => (
              <TouchableOpacity
                key={theme}
                style={styles.themeButton}
                onPress={() => {
                  playClick(settings.sfx);
                  navigation.navigate('Game', { mode: 'theme', difficulty: theme, themeName: theme });
                }}
              >
                <Text style={styles.themeTitle}>{theme}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: scaleY(40) }} />
      </ScrollView>

      <CustomAlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
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
  titleContainer: {
    paddingHorizontal: ms(20),
    paddingVertical: isSmallDevice ? scaleY(20) : scaleY(30),
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: ms(70, 0.3),
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleY(15),
    gap: 10,
  },
  line: {
    width: 30,
    height: 1,
    backgroundColor: COLORS.black,
  },
  subtitle: {
    ...TYPOGRAPHY.subtitle,
  },
  modeCard: {
    paddingVertical: scaleY(18),
    paddingHorizontal: ms(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modeLabel: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: scaleY(6),
    color: COLORS.textSecondary,
  },
  modeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  arrow: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  modeSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    opacity: 0.8,
    marginTop: scaleY(2),
  },
  themeSection: {
    paddingVertical: scaleY(18),
    paddingHorizontal: ms(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  themeButton: {
    paddingVertical: scaleY(12),
    paddingHorizontal: ms(20),
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 0,
  },
  themeTitle: {
    ...TYPOGRAPHY.button,
    fontSize: ms(14),
    color: COLORS.black,
  },
});
