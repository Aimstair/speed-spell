import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { requestNotificationPermissions, scheduleRetentionNotifications } from './src/utils/notifications';
import { AppNavigator } from './src/navigation/AppNavigator';

// Configure AdMob to ensure compliance with Google Play's Families Policy
mobileAds()
  .setRequestConfiguration({
    // Set max ad content rating to G (suitable for general audiences, including families/children)
    maxAdContentRating: MaxAdContentRating.G,
    // Indicate that the app is child-directed for COPPA compliance
    tagForChildDirectedTreatment: true,
    // Indicate that the app is for under age of consent for GDPR compliance
    tagForUnderAgeOfConsent: true,
  })
  .then(() => {
    mobileAds().initialize();
  });

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
