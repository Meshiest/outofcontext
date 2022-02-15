import { createSlice } from '@reduxjs/toolkit';

const updateDarkMode = mode => {
  document.body.classList[mode ? 'add' : 'remove']('dark-theme');
  localStorage.occDarkMode = mode;
  return mode;
};

const darkMode = createSlice({
  name: 'darkMode',
  initialState: updateDarkMode(localStorage.occDarkMode === 'true'),
  reducers: {
    toggleDarkMode: state => updateDarkMode(!state),
  },
});

export const { toggleDarkMode } = darkMode.actions;
export default darkMode.reducer;
