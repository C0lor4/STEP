/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../styles.css';
import './styles/sparkle-trail.css';

const ACTIVE_TITLE = 'StepFurther';
const INACTIVE_TITLE = 'Jon is Walking';

function syncDocumentTitle(): void {
  document.title = document.hidden ? INACTIVE_TITLE : ACTIVE_TITLE;
}

document.addEventListener('visibilitychange', syncDocumentTitle);
window.addEventListener('focus', syncDocumentTitle);
window.addEventListener('blur', syncDocumentTitle);
syncDocumentTitle();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
