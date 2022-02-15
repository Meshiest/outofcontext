import { SOUNDS } from './sounds.jsx';

const loadedSounds = {};

// load a new turnsound into memory
export const loadTurnSound = name =>
  (loadedSounds[name] ??= new Audio(soundMap[name]));

// update the current turn sound
export const updateTurnSound = sound => {
  if (!(sound in SOUNDS)) {
    localStorage.oocTurnSound = '';
    return null;
  }
  localStorage.oocTurnSound = sound;
  loadTurnSound(sound);
  return sound;
};

// play a turn sound
export const playTurnSound = () => {
  if (!localStorage.oocTurnSound) return;
  const sound = loadedSounds[localStorage.oocTurnSound];
  if (!sound) return;

  sound.currentTime = 0;
  sound.play();
};
