import { useLanguage } from './hooks.jsx';
import { LANGUAGES } from './languages.jsx';
import get from 'lodash/get';
import { memo } from 'react';

export const i18n = name =>
  get(LANGUAGES[localStorage.oocLanguage || 'en_US'], name, name.toUpperCase());

export const T = memo(({ name }) =>
  get(LANGUAGES[useLanguage()], name, name.toUpperCase())
);
