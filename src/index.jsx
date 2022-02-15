import 'fomantic-ui-css/semantic.min.css';
import '../res/favicon.ico?name=favicon.ico';
import './style.css';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './routes.jsx';
import { store } from './store.jsx';

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  </Provider>,
  document.getElementById('app')
);
