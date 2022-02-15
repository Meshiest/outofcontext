import { useSelector } from 'react-redux';
import { selectStreamerMode } from './selectors.jsx';

export const useStreamerMode = () => useSelector(selectStreamerMode);
