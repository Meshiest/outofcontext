import { createSelector } from '@reduxjs/toolkit';

export const selectStreamerMode = createSelector(
  state => state,
  state => state.streamerMode
);
