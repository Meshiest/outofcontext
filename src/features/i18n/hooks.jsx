import { useSelector } from 'react-redux';
import { selectLanguage } from './selectors.jsx';

export const useLanguage = () => useSelector(selectLanguage);
