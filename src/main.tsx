/// <reference types="vite/client" />
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import { watchLibraryEdits } from './state/data.ts';

watchLibraryEdits();

const container = document.querySelector('#root');
if (container === null) {
  throw new Error('The #root element is missing from index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
