import { createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import reducer from './reducer.jsx';

export const store = createStore(reducer, composeWithDevTools());
