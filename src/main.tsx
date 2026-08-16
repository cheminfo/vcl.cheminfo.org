/// <reference types="vite/client" />
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import { watchLibraryEdits } from './state/data.ts';
import { adoptLegacyHashAddress } from './state/view.ts';

// A link written while this site routed by the hash still opens: the address it
// meant is put in the bar before anything reads the address.
adoptLegacyHashAddress();

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
