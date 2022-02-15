import { createSelector } from '@reduxjs/toolkit';

export const selectLanguage = createSelector(
  state => state,
  state => state.i18n
);
