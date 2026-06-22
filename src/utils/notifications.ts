import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

const CANCEL_RETENTION_IDENTIFIER = 'retention-notification';
const CANCEL_STREAK_IDENTIFIER = 'streak-notification';
const CANCEL_GRAVEYARD_IDENTIFIER = 'graveyard-notification';

export const scheduleRetentionNotifications = async () => {
  await Notifications.cancelScheduledNotificationAsync(CANCEL_RETENTION_IDENTIFIER);
  await Notifications.cancelScheduledNotificationAsync(CANCEL_RETENTION_IDENTIFIER + '-3days');

  // Schedule for 24 hours
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Train! 🧠",
      body: "Expand your vocabulary. Jump in for a quick Speed Spell session!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24, // 24 hours
    },
    identifier: CANCEL_RETENTION_IDENTIFIER,
  });

  // Schedule for 3 days
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "We miss you! 👋",
      body: "Your ELO is waiting to be improved. Come play a round!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 3, // 3 days
    },
    identifier: CANCEL_RETENTION_IDENTIFIER + '-3days',
  });
};

export const scheduleStreakReminder = async (currentStreak: number, hasPlayedToday: boolean) => {
  await Notifications.cancelScheduledNotificationAsync(CANCEL_STREAK_IDENTIFIER);

  if (hasPlayedToday || currentStreak === 0) return;

  const now = new Date();
  const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0); // 6:00 PM today

  if (now.getTime() < reminderTime.getTime()) {
    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Streak at Risk! 🔥",
        body: `Your ${currentStreak}-day Speed Spell streak is at risk! Tap to practice.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReminder,
      },
      identifier: CANCEL_STREAK_IDENTIFIER,
    });
  }
};

export const scheduleGraveyardReminder = async (weakWordCount: number) => {
  await Notifications.cancelScheduledNotificationAsync(CANCEL_GRAVEYARD_IDENTIFIER);

  if (weakWordCount < 5) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "The Graveyard is Full! 🪦",
      body: `You have ${weakWordCount} weak words waiting to be reviewed. Time to clear them!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 2, // 2 days from now
    },
    identifier: CANCEL_GRAVEYARD_IDENTIFIER,
  });
};
