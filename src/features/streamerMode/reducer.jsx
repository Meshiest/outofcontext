import { createSlice } from '@reduxjs/toolkit';

const streamerMode = createSlice({
  name: 'streamerMode',
  initialState: localStorage.oocHideLobby === 'true',
  reducers: {
    toggleStreamerMode: state => (localStorage.oocHideLobby = !state),
  },
});

export const { toggleStreamerMode } = streamerMode.actions;
export default streamerMode.reducer;
