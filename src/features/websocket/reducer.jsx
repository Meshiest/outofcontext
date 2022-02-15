import { createSlice } from '@reduxjs/toolkit';
const VERSION = require('../../../package.json').version;

const websocketSlice = createSlice({
  name: 'websocket',
  initialState: { connected: false, disconnected: false, version: '' },
  reducers: {
    setConnected(state, action) {
      const connected = action.payload;
      console.log(connected ? 'Connected' : 'Lost Connection');
      state.connected = connected;
      state.disconnected = !connected;
    },
    setVersion: {
      reducer: (state, action) => {
        const { version } = action.payload;
        if (version !== VERSION) {
          console.warn(
            `Incompatible version. Server has ${version}. I have ${VERSION}`
          );
          setTimeout(location.reload, 2000);
        }
      },
      prepare: version => ({ payload: { version } }),
    },
  },
});

export const { setConnected, setDisconnected, setVersion } =
  websocketSlice.actions;
export default websocketSlice.reducer;
