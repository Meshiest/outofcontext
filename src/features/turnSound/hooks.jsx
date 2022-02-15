import { useSelector } from 'react-redux';
import { selectTurnSound } from './selectors';

export const useTurnSound = () => useSelector(selectTurnSound);
