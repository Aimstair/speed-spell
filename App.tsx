import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { requestNotificationPermissions, scheduleRetentionNotifications } from './src/utils/notifications';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleRetentionNotifications();
      }
    };
    setupNotifications();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
