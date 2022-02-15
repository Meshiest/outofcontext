import { createSlice } from '@reduxjs/toolkit';

const lobbySlice = createSlice({
  name: 'lobby',
  initialState: { code: null },
  extraReducers: {},
});

export default lobbySlice.reducer;
