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
const CANCEL_REPLENISH_IDENTIFIER = 'replenish-notification';

export const scheduleRetentionNotifications = async () => {
  await Notifications.cancelScheduledNotificationAsync(CANCEL_RETENTION_IDENTIFIER);
  await Notifications.cancelScheduledNotificationAsync(CANCEL_RETENTION_IDENTIFIER + '-3days');

  // Schedule for 24 hours
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Train! 🧠",
      body: "Keep your mind sharp. Jump in for a quick Speed Math session!",
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
      body: "Your cognitive score is waiting to be improved. Come play a round!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 3, // 3 days
    },
    identifier: CANCEL_RETENTION_IDENTIFIER + '-3days',
  });
};

export const scheduleCompeteReplenishNotification = async () => {
  await Notifications.cancelScheduledNotificationAsync(CANCEL_REPLENISH_IDENTIFIER);

  const now = new Date();
  
  // We want to notify them the morning AFTER their tries replenish.
  // Tries replenish at local midnight. We'll notify at 8:00 AM the next day.
  const nextMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
  const secondsUntilMorning = Math.max(60, Math.floor((nextMorning.getTime() - now.getTime()) / 1000));
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Tries Replenished! 🏆",
      body: "Your daily ranked tries are full. Go get that ELO!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilMorning,
    },
    identifier: CANCEL_REPLENISH_IDENTIFIER,
  });
};
