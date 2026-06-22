import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

const PLAY_STORE_URL = 'market://details?id=com.aimteralabs.speedspell';
const FALLBACK_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aimteralabs.speedspell';

// This URL should point to a raw JSON file you host online (e.g. GitHub Gist).
// Example JSON format: { "latestVersion": "1.0.1" }
const VERSION_URL = 'https://raw.githubusercontent.com/Aimstair/speed-spell/main/version.json';

const isNewerVersion = (current: string, latest: string) => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (c > l) return false;
  }
  return false;
};

export const checkAppVersion = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    
    // --- REAL IMPLEMENTATION ---
    // Uncomment this when you host your own version.json file:
    /*
    const response = await fetch(VERSION_URL);
    if (!response.ok) return false;
    const data = await response.json();
    const latestVersion = data.latestVersion;
    */
    
    // --- MOCK IMPLEMENTATION FOR TESTING ---
    // Change this to "1.0.0" when you are done testing to stop the popup,
    // or uncomment the real implementation above.
    const latestVersion = "1.0.1"; 
    
    if (latestVersion && isNewerVersion(currentVersion, latestVersion)) {
      return true;
    }
    return false;
  } catch (e) {
    console.warn("Failed to check app version:", e);
    return false;
  }
};
