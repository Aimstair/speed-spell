import { createAudioPlayer } from 'expo-audio';

const clickSource = require('../../assets/Sounds/Click.mp3');

export const clickPlayer = createAudioPlayer(clickSource);

export const playClick = (sfxEnabled: boolean) => {
  if (sfxEnabled && clickPlayer) {
    try {
      clickPlayer.seekTo(0);
      clickPlayer.play();
    } catch (e) {
      console.warn('Failed to play click sound', e);
    }
  }
};
