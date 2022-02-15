import { createSelector } from '@reduxjs/toolkit';

export const selectWebsocket = createSelector(
  state => state,
  state => state.websocket
);

export const selectConnected = createSelector(
  selectWebsocket,
  socket => socket.connected
);
export const selectDisconnected = createSelector(
  selectWebsocket,
  socket => socket.disconnected
);
