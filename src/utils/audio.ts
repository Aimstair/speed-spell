import { createAudioPlayer } from 'expo-audio';

export const SOUND_VOLUMES = {
  beep: 5.0,
  correct: 0.8,
  wrong: 1.0,
  tick: 1.0,
  click: 1.0,
  type: 0.25,
};

const clickSource = require('../../assets/Sounds/Click.mp3');
const beepSource = require('../../assets/Sounds/Beep.mp3');
const correctSource = require('../../assets/Sounds/Correct.mp3');
const wrongSource = require('../../assets/Sounds/Wrong.mp3');
const tickSource = require('../../assets/Sounds/Tick.m4a');
const typeSource = require('../../assets/Sounds/Type.mp3');

export const clickPlayer = createAudioPlayer(clickSource);
export const beepPlayer = createAudioPlayer(beepSource);
export const correctPlayer = createAudioPlayer(correctSource);
export const wrongPlayer = createAudioPlayer(wrongSource);
export const tickPlayer = createAudioPlayer(tickSource);
export const typePlayer = createAudioPlayer(typeSource);

const playedOnce: Record<string, boolean> = {};

export const playSoundEffect = (type: 'beep' | 'correct' | 'wrong' | 'tick' | 'click' | 'type', sfxEnabled: boolean) => {
  if (!sfxEnabled) return;
  try {
    let player;
    if (type === 'beep') player = beepPlayer;
    else if (type === 'correct') player = correctPlayer;
    else if (type === 'wrong') player = wrongPlayer;
    else if (type === 'tick') player = tickPlayer;
    else if (type === 'click') player = clickPlayer;
    else if (type === 'type') player = typePlayer;

    if (player) {
      player.volume = SOUND_VOLUMES[type];
      if (playedOnce[type]) {
        player.seekTo(0);
      }
      player.play();
      playedOnce[type] = true;
    }
  } catch (e) {
    console.warn(`Failed to play ${type} sound`, e);
  }
};

export const playClick = (sfxEnabled: boolean) => playSoundEffect('click', sfxEnabled);
export const playType = (sfxEnabled: boolean) => playSoundEffect('type', sfxEnabled);
