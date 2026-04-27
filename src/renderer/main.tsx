import ReactDOM from 'react-dom/client';
import App from './App';
import PresenterApp from './PresenterApp';
import { ToastProvider } from './components/ui/Toast';
import './i18n'; // Initialize i18n
import './styles/index.css';

const isPresenterRenderer = new URLSearchParams(window.location.search).get('presenter') === '1';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    {isPresenterRenderer ? <PresenterApp /> : <App />}
  </ToastProvider>
);
