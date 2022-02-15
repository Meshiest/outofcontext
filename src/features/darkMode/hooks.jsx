import { useSelector } from 'react-redux';
import { selectDarkMode } from './selectors';

export const useDarkMode = () => useSelector(selectDarkMode);
