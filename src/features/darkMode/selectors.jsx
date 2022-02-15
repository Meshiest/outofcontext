import { createSelector } from '@reduxjs/toolkit';

export const selectDarkMode = createSelector(
  state => state,
  state => state.darkMode
);
