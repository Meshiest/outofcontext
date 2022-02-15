import { createSelector } from '@reduxjs/toolkit';

export const selectTurnSound = createSelector(
  state => state,
  state => state.turnSound
);
