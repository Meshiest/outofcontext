import { createSelector } from '@reduxjs/toolkit';

const selectState = createSelector(
  state => state,
  state => state.rocketcrab
);

export const selectRocketCrab = createSelector(
  selectState,
  state => state.isRocketCrab
);
