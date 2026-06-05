import { createAudioPlayer } from 'expo-audio';

export const SOUND_VOLUMES = {
  beep: 0.3,
  correct: 0.8,
  wrong: 1.0,
  tick: 1.0,
  click: 1.0,
};

const clickSource = require('../../assets/Sounds/Click.mp3');
const beepSource = require('../../assets/Sounds/Beep.mp3');
const correctSource = require('../../assets/Sounds/Correct.mp3');
const wrongSource = require('../../assets/Sounds/Wrong.mp3');
const tickSource = require('../../assets/Sounds/Tick.m4a');

export const clickPlayer = createAudioPlayer(clickSource);
export const beepPlayer = createAudioPlayer(beepSource);
export const correctPlayer = createAudioPlayer(correctSource);
export const wrongPlayer = createAudioPlayer(wrongSource);
export const tickPlayer = createAudioPlayer(tickSource);

export const playSoundEffect = (type: 'beep' | 'correct' | 'wrong' | 'tick' | 'click', sfxEnabled: boolean) => {
  if (!sfxEnabled) return;
  try {
    let player;
    if (type === 'beep') player = beepPlayer;
    else if (type === 'correct') player = correctPlayer;
    else if (type === 'wrong') player = wrongPlayer;
    else if (type === 'tick') player = tickPlayer;
    else if (type === 'click') player = clickPlayer;

    if (player) {
      player.volume = SOUND_VOLUMES[type];
      player.seekTo(0);
      player.play();
    }
  } catch (e) {
    console.warn(`Failed to play ${type} sound`, e);
  }
};

export const playClick = (sfxEnabled: boolean) => playSoundEffect('click', sfxEnabled);
