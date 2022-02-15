import { createSlice } from '@reduxjs/toolkit';
import { LANGUAGES } from './languages.jsx';

const i18n = createSlice({
  name: 'i18n',
  initialState: localStorage.oocLanguage || 'en_US',
  reducers: {
    setLanguage(state, action) {
      const lang = action.payload;
      if (!(lang in LANGUAGES)) return;

      state = localStorage.oocLanguage = lang;
    },
  },
});

export const { setLanguage } = i18n.actions;
export default i18n.reducer;
