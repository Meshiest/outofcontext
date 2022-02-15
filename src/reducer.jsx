import { combineReducers } from 'redux';
import darkMode from './features/darkMode/reducer.jsx';
import i18n from './features/i18n/reducer.jsx';
import rocketcrab from './features/rocketcrab/reducer.jsx';
import streamerMode from './features/streamerMode/reducer.jsx';
import turnSound from './features/turnSound/reducer.jsx';
import websocket from './features/websocket/reducer.jsx';
import lobby from './lobby/reducer.jsx';

const rootReducer = combineReducers({
  lobby,
  darkMode,
  streamerMode,
  rocketcrab,
  websocket,
  i18n,
  turnSound,
});

export default rootReducer;
