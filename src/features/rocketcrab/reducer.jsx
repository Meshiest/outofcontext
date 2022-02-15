import { createSlice } from '@reduxjs/toolkit';

const streamerMode = createSlice({
  name: 'streamerMode',
  initialState: {
    isRocketCrab: false,
    name: '',
    isHost: false,
  },
  reducers: {
    setRocketCrab: {
      reducer: (state, action) => {
        const name = (action.payload.name || '')
          .replace(/[\u200B-\u200D\uFEFF\n\t]/g, '')
          .trim();
        console.log('Hello', name, 'from rocketcrab!');
        state.name = name;
        state.isHost = action.payload.connected;
      },
      prepare: (name, isHost) => ({ payload: { name, isHost } }),
    },
  },
});

export const { setRocketCrab } = streamerMode.actions;
export default streamerMode.reducer;
