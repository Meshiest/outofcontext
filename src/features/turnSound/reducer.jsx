import { createSlice } from '@reduxjs/toolkit';
import { updateTurnSound } from './util.jsx';

const turnSound = createSlice({
  name: 'turnSound',
  initialState: updateTurnSound(localStorage.occDarkMode === 'true'),
  reducers: {
    setTurnSound: (state, action) => updateTurnSound(action.payload),
  },
});

export const { setTurnSound } = turnSound.actions;
export default turnSound.reducer;
